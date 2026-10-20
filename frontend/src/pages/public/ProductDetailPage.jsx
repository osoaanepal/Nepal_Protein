import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Award,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductDescription } from '../../components/product/ProductDescription';
import { SEO } from '../../components/seo/SEO';
import { buildProductSchema } from '../../utils/seoSchemas';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isLoading, setIsLoading] = useState(true);

  // Review Form Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        const prodData = res.data.data;
        setProduct(prodData);

        const primaryImg = prodData.images?.find((img) => img.isPrimary)?.url || prodData.images?.[0]?.url || '';
        setSelectedImage(primaryImg);

        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        } else {
          setSelectedVariant(null);
        }

        // Fetch reviews
        const revRes = await api.get(`/reviews/product/${prodData._id}`);
        setReviews(revRes.data.data || []);

        // Fetch related products
        if (prodData.category?._id) {
          const relRes = await api.get(`/products?category=${prodData.category._id}&limit=4`);
          setRelatedProducts(relRes.data.products?.filter((p) => p._id !== prodData._id) || []);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4 bg-white">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4 bg-white">
        <h2 className="text-2xl font-bold text-black">Product Not Found</h2>
        <p className="text-sm text-slate-500">The supplement or product you are looking for may have been removed.</p>
        <Link to="/shop" className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-orange-sm">
          Return to Shop
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentCompareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const discountPercent = currentCompareAtPrice > currentPrice
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await api.post(`/reviews/product/${product._id}`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      setReviewSuccess('Thank you! Your verified review has been published.');
      setReviews([res.data.data, ...reviews]);
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewTitle('');
        setReviewComment('');
        setReviewSuccess('');
      }, 1500);
    } catch (err) {
      setReviewError(err.customMessage || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // These are ordinary calculations, not React hooks. Keep them below the
  // loading and product-not-found returns so the Rules of Hooks are respected.
  const productSchema = buildProductSchema(product, selectedVariant);

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    ...(product.brand?.name
      ? [{
        name: product.brand.name,
        item: `/brands/${encodeURIComponent(product.brand.slug || '')}`,
      }]
      : []),
    ...(product.category?.name
      ? [{
        name: product.category.name,
        item: `/shop?category=${encodeURIComponent(product.category.slug || '')}`,
      }]
      : []),
    {
      name: product.name,
      item: `/product/${encodeURIComponent(product.slug || slug)}`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 bg-white">
      <SEO
        title={`${product.name} | Buy Authentic in Nepal | Nepal Protein`}
        description={product.shortDescription || `${product.name} available at Nepal Protein. Authentic sports nutrition with fast nationwide delivery in Nepal.`}
        canonical={`/product/${product.slug}`}
        ogImage={selectedImage}
        ogType="product"
        breadcrumbs={breadcrumbs}
        jsonLd={productSchema}
        productMeta={{
          price: currentPrice,
          availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <Link to="/" className="hover:text-orange-600 font-medium">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/shop" className="hover:text-orange-600 font-medium">Shop</Link>
        {product.brand && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to={`/brands/${product.brand.slug}`} className="hover:text-orange-600 font-medium text-orange-600">
              {product.brand.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-orange-600 font-medium">{product.category?.name}</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout: Gallery + Purchasing Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${selectedImage === img.url ? 'border-orange-500 shadow-orange-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                >
                  <img src={img.url} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Buying Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-black font-bold uppercase tracking-wider mb-2 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {product.brand && (
                  <Link
                    to={`/brands/${product.brand.slug}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100 transition"
                  >
                    <span>Brand: {product.brand.name}</span>
                  </Link>
                )}
                <span className="text-slate-600">{product.category?.name || 'Supplements'}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars & Review Count */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(product.ratingAverage || 5) ? 'fill-current' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">
                {product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-slate-500">
                ({product.ratingCount || reviews.length} customer reviews)
              </span>
            </div>
          </div>

          {/* Pricing in NPR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline gap-3">
            <span className="text-3xl font-black text-black">
              {formatNpr(currentPrice)}
            </span>
            {currentCompareAtPrice > currentPrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatNpr(currentCompareAtPrice)}
              </span>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              (Inclusive of all taxes in Nepal)
            </span>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Variant Selector (Flavors / Sizes) */}
          {product.variants?.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Option / Flavor:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${selectedVariant?._id === v._id
                        ? 'bg-black border-black text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    {v.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Availability:</span>
            {currentStock > 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                In Stock ({currentStock > 10 ? 'Ready for Dispatch' : `Only ${currentStock} left`})
              </span>
            ) : (
              <span className="text-rose-600 font-bold">Out of Stock</span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-3 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="p-3 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-orange-md flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product._id)}
                className={`p-3.5 rounded-xl border transition shadow-sm ${inWishlist ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              Buy Now with 1-Click
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <span className="font-semibold text-slate-800">100% Genuine</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Award className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <span className="font-semibold text-slate-800">DFTQC Standards</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Truck className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <span className="font-semibold text-slate-800">Nepal Delivery</span>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs Section */}
      <div className="pt-8 border-t border-slate-200 space-y-8">

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-8 overflow-x-auto">
          {['description', 'nutrition', 'usage', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab === 'description' && 'Product Details'}
              {tab === 'nutrition' && 'Nutritional Facts & Ingredients'}
              {tab === 'usage' && 'How to Use'}
              {tab === 'reviews' && `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'description' && (
          <div className="max-w-none text-slate-700 text-sm leading-relaxed">
            <ProductDescription description={product.description} />
          </div>
        )}

        {/* Tab 2: Nutrition & Ingredients */}
        {activeTab === 'nutrition' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-black">Nutrition Information</h3>
              {product.nutritionInformation?.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nutrient</th>
                        <th className="p-3">Amount Per Serving</th>
                        <th className="p-3">% Daily Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {product.nutritionInformation.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-slate-900">{item.nutrient}</td>
                          <td className="p-3">{item.amountPerServing}</td>
                          <td className="p-3">{item.percentageDV || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Refer to product packaging for specific nutrient facts.</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-black">Ingredients</h3>
              {product.ingredients?.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {product.ingredients.map((ing, idx) => (
                    <li key={idx} className="leading-relaxed">{ing}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">100% pure formulation ingredients detailed on label.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Usage */}
        {activeTab === 'usage' && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 max-w-2xl text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-black">Recommended Usage & Directions</h3>
            <p>{product.usageInstructions || 'Mix 1 scoop with 200-250ml cold water or beverage of choice in a shaker bottle. Consume post-workout or as recommended by your certified trainer.'}</p>
          </div>
        )}

        {/* Tab 4: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-black">Verified Customer Reviews</h3>
                <p className="text-xs text-slate-500">Real feedback from athletes and buyers across Nepal</p>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm"
              >
                Write a Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-sm font-bold text-slate-900">No reviews yet.</p>
                <p className="text-xs text-slate-500">Be the first verified customer in Nepal to review this supplement!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{rev.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">{rev.customer?.name || 'Verified Buyer'}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Write Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-black">Write a Review</h3>
            <p className="text-xs text-slate-500">Share your genuine experience with this product.</p>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                  <div className="flex gap-2 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-current' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excellent mixability and great taste!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Detailed Comment</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How was the flavor, mixability, digestion, and results?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl disabled:opacity-50 shadow-orange-sm"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-black text-black">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd._id} product={relProd} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
