import { productService } from '../services/product.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { Product } from '../models/Product.js';

console.log('====================================================');
console.log('Nepal Protein: Product Image Reordering & Manifest Tests');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

// Minimal valid mock image buffer (valid JPEG header: FF D8 FF)
const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

async function runTests() {
  // Store original methods
  const origUpload = cloudinaryService.uploadImage;
  const origDelete = cloudinaryService.deleteImage;
  const origCreate = Product.create;
  const origFindById = Product.findById;
  const origFindOne = Product.findOne;

  const uploadedTracker = [];
  const deletedTracker = [];

  // Mock Cloudinary
  cloudinaryService.uploadImage = async (buffer, folder) => {
    const id = `test_upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const url = `https://res.cloudinary.com/test/image/upload/${id}.jpg`;
    uploadedTracker.push({ id, url });
    return { url, publicId: id };
  };

  cloudinaryService.deleteImage = async (publicId) => {
    deletedTracker.push(publicId);
    return { result: 'ok' };
  };

  try {
    // -------------------------------------------------------------
    // Test 1: createProduct with imagesManifest reordering 3 files
    // -------------------------------------------------------------
    console.log('--- 1. Create Product with Manifest Reordering ---');
    Product.findOne = async () => null; // No duplicate slug
    let createdDoc = null;
    Product.create = async (doc) => {
      createdDoc = { ...doc };
      return createdDoc;
    };

    const newFiles = [
      { buffer: validJpgBuffer, originalname: 'file0.jpg' },
      { buffer: validJpgBuffer, originalname: 'file1.jpg' },
      { buffer: validJpgBuffer, originalname: 'file2.jpg' },
    ];

    // Manifest reorders files: file 2 first, then file 0, then file 1
    const createManifest = [
      { type: 'new', fileIndex: 2 },
      { type: 'new', fileIndex: 0 },
      { type: 'new', fileIndex: 1 },
    ];

    await productService.createProduct(
      {
        name: 'Test Whey Isolate',
        price: 5000,
        imagesManifest: JSON.stringify(createManifest),
      },
      newFiles
    );

    assert(createdDoc !== null, 'Product.create was called');
    assert(createdDoc.images.length === 3, 'Created product contains 3 images');
    assert(createdDoc.images[0].isPrimary === true, 'First image (index 0) has isPrimary: true');
    assert(createdDoc.images[1].isPrimary === false, 'Second image (index 1) has isPrimary: false');
    assert(createdDoc.images[2].isPrimary === false, 'Third image (index 2) has isPrimary: false');
    // Verify file 2 is at index 0, file 0 is at index 1, file 1 is at index 2
    assert(createdDoc.images[0].publicId === uploadedTracker[2].id, 'Manifest index 0 matches fileIndex 2');
    assert(createdDoc.images[1].publicId === uploadedTracker[0].id, 'Manifest index 1 matches fileIndex 0');
    assert(createdDoc.images[2].publicId === uploadedTracker[1].id, 'Manifest index 2 matches fileIndex 1');

    // -------------------------------------------------------------
    // Test 2: updateProduct moving newly uploaded image to position 0
    // -------------------------------------------------------------
    console.log('\n--- 2. Update Product with Mixed Existing & New Images ---');
    const existingImages = [
      { url: 'https://res.cloudinary.com/test/exist1.jpg', publicId: 'exist_pub_1', isPrimary: true },
      { url: 'https://res.cloudinary.com/test/exist2.jpg', publicId: 'exist_pub_2', isPrimary: false },
    ];

    let savedProduct = {
      _id: 'prod_123',
      name: 'Existing Product',
      images: [...existingImages],
      save: async function () { return this; },
    };

    Product.findById = async () => savedProduct;

    uploadedTracker.length = 0;
    deletedTracker.length = 0;

    const singleNewFile = [{ buffer: validJpgBuffer, originalname: 'newHero.jpg' }];

    // Manifest places new upload at index 0, then exist2 at index 1, exist1 at index 2
    const updateManifest = [
      { type: 'new', fileIndex: 0 },
      { type: 'existing', url: 'https://res.cloudinary.com/test/exist2.jpg', publicId: 'exist_pub_2' },
      { type: 'existing', url: 'https://res.cloudinary.com/test/exist1.jpg', publicId: 'exist_pub_1' },
    ];

    await productService.updateProduct('prod_123', {
      imagesManifest: JSON.stringify(updateManifest),
    }, singleNewFile);

    assert(savedProduct.images.length === 3, 'Updated product has 3 images total');
    assert(savedProduct.images[0].isPrimary === true, 'New image placed at index 0 is marked primary');
    assert(savedProduct.images[0].publicId === uploadedTracker[0].id, 'Index 0 has the new uploaded file publicId');
    assert(savedProduct.images[1].publicId === 'exist_pub_2', 'Index 1 is exist2');
    assert(savedProduct.images[1].isPrimary === false, 'Index 1 is not primary');
    assert(savedProduct.images[2].publicId === 'exist_pub_1', 'Index 2 is exist1');
    assert(savedProduct.images[2].isPrimary === false, 'Index 2 is not primary');
    assert(deletedTracker.length === 0, 'No existing images were deleted from Cloudinary');

    // -------------------------------------------------------------
    // Test 3: updateProduct removing an image and moving last to first
    // -------------------------------------------------------------
    console.log('\n--- 3. Update Product Reordering and Removing Existing Image ---');
    // Start with 3 images: [imgA, imgB, imgC]
    savedProduct.images = [
      { url: 'https://res.cloudinary.com/test/imgA.jpg', publicId: 'pub_A', isPrimary: true },
      { url: 'https://res.cloudinary.com/test/imgB.jpg', publicId: 'pub_B', isPrimary: false },
      { url: 'https://res.cloudinary.com/test/imgC.jpg', publicId: 'pub_C', isPrimary: false },
    ];

    deletedTracker.length = 0;

    // Remove imgB, and reverse order: [imgC, imgA]
    const removeAndReorderManifest = [
      { type: 'existing', url: 'https://res.cloudinary.com/test/imgC.jpg', publicId: 'pub_C' },
      { type: 'existing', url: 'https://res.cloudinary.com/test/imgA.jpg', publicId: 'pub_A' },
    ];

    await productService.updateProduct('prod_123', {
      imagesManifest: JSON.stringify(removeAndReorderManifest),
    }, []);

    assert(savedProduct.images.length === 2, 'Product now has 2 images');
    assert(savedProduct.images[0].publicId === 'pub_C', 'imgC is now at index 0');
    assert(savedProduct.images[0].isPrimary === true, 'imgC is now marked isPrimary: true');
    assert(savedProduct.images[1].publicId === 'pub_A', 'imgA is now at index 1');
    assert(savedProduct.images[1].isPrimary === false, 'imgA is now marked isPrimary: false');
    assert(deletedTracker.includes('pub_B'), 'Removed image pub_B was deleted from Cloudinary');
    assert(!deletedTracker.includes('pub_A'), 'Retained image pub_A was NOT deleted from Cloudinary');
    assert(!deletedTracker.includes('pub_C'), 'Retained image pub_C was NOT deleted from Cloudinary');

    // -------------------------------------------------------------
    // Test 4: Replacing an image preserves its slot
    // -------------------------------------------------------------
    console.log('\n--- 4. Replacing an Image in Middle Slot ---');
    // Current: [pub_C, pub_A]
    // Replace pub_A (at index 1) with a new upload
    uploadedTracker.length = 0;
    deletedTracker.length = 0;

    const replaceFile = [{ buffer: validJpgBuffer, originalname: 'replacement.jpg' }];
    const replaceManifest = [
      { type: 'existing', url: 'https://res.cloudinary.com/test/imgC.jpg', publicId: 'pub_C' },
      { type: 'new', fileIndex: 0 },
    ];

    await productService.updateProduct('prod_123', {
      imagesManifest: JSON.stringify(replaceManifest),
    }, replaceFile);

    assert(savedProduct.images.length === 2, 'Product retains 2 images');
    assert(savedProduct.images[0].publicId === 'pub_C', 'Index 0 remains pub_C');
    assert(savedProduct.images[0].isPrimary === true, 'Index 0 remains primary');
    assert(savedProduct.images[1].publicId === uploadedTracker[0].id, 'Index 1 is the new replaced file');
    assert(savedProduct.images[1].isPrimary === false, 'Index 1 is not primary');
    assert(deletedTracker.includes('pub_A'), 'Replaced image pub_A was deleted from Cloudinary');
    assert(!deletedTracker.includes('pub_C'), 'Retained image pub_C was NOT deleted');

    // -------------------------------------------------------------
    // Test 5: Error safety & rollback
    // -------------------------------------------------------------
    console.log('\n--- 5. Error Safety & Upload Rollback ---');
    uploadedTracker.length = 0;
    deletedTracker.length = 0;

    // Simulate save failure
    savedProduct.save = async function () {
      throw new Error('Database disk full / validation failure');
    };

    const failUploadFiles = [{ buffer: validJpgBuffer, originalname: 'rollbackMe.jpg' }];
    const failManifest = [
      { type: 'new', fileIndex: 0 },
    ];

    let threwError = false;
    try {
      await productService.updateProduct('prod_123', {
        imagesManifest: JSON.stringify(failManifest),
      }, failUploadFiles);
    } catch (err) {
      threwError = true;
    }

    assert(threwError === true, 'Operation threw error as expected');
    assert(uploadedTracker.length === 1, 'File was uploaded to Cloudinary initially');
    assert(deletedTracker.includes(uploadedTracker[0].id), 'Newly uploaded file was deleted from Cloudinary on failure');

    // -------------------------------------------------------------
    // Test 6: Invalid manifest rejection
    // -------------------------------------------------------------
    console.log('\n--- 6. Invalid Manifest Rejection ---');
    let manifestErrorCaught = false;
    try {
      await productService.updateProduct('prod_123', {
        imagesManifest: JSON.stringify([{ type: 'new', fileIndex: 99 }]), // out of bounds
      }, []);
    } catch (err) {
      manifestErrorCaught = true;
    }
    assert(manifestErrorCaught === true, 'Out-of-bounds fileIndex in manifest was rejected');

    // -------------------------------------------------------------
    // Test 7: Legacy fallback compatibility
    // -------------------------------------------------------------
    console.log('\n--- 7. Backward Compatibility (No Manifest) ---');
    savedProduct.save = async function () { return this; };
    savedProduct.images = [{ url: 'https://res.cloudinary.com/test/leg.jpg', publicId: 'leg_1', isPrimary: true }];
    uploadedTracker.length = 0;

    const legacyFiles = [{ buffer: validJpgBuffer, originalname: 'legacy.jpg' }];
    await productService.updateProduct('prod_123', {
      existingImages: JSON.stringify(savedProduct.images),
    }, legacyFiles);

    assert(savedProduct.images.length === 2, 'Legacy call appended uploaded file to existing images');
    assert(savedProduct.images[0].publicId === 'leg_1', 'First image retained');
    assert(savedProduct.images[0].isPrimary === true, 'First image is primary');
    assert(savedProduct.images[1].publicId === uploadedTracker[0].id, 'Second image appended');
    assert(savedProduct.images[1].isPrimary === false, 'Second image is not primary');

  } finally {
    // Restore original methods
    cloudinaryService.uploadImage = origUpload;
    cloudinaryService.deleteImage = origDelete;
    Product.create = origCreate;
    Product.findById = origFindById;
    Product.findOne = origFindOne;
  }

  console.log('\n====================================================');
  console.log(`Test Summary: ${passedTests} / ${totalTests} Passed`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
