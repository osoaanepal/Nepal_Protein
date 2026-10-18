import React, { useState } from 'react';
import { MapPin, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { NEPAL_PROVINCES, NEPAL_DISTRICTS_BY_PROVINCE } from '../../constants/nepalAddresses';
import api from '../../services/api';

export const AddressesPage = () => {
  const { user, setUser } = useAuthStore();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    province: 'Bagmati',
    district: 'Kathmandu',
    municipality: '',
    ward: '',
    streetAddress: '',
    landmark: '',
    isDefault: true,
  });

  const availableDistricts = NEPAL_DISTRICTS_BY_PROVINCE[newAddr.province] || [];

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const updatedList = [...addresses, newAddr];
      const res = await api.put('/users/profile', { addresses: updatedList });
      setUser(res.data.user);
      setAddresses(res.data.user.addresses);
      setShowAddForm(false);
    } catch (err) {
      alert(err.customMessage || 'Failed to save address');
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-black text-black uppercase tracking-wider">Saved Addresses</h2>
          <p className="text-xs text-slate-500">Manage delivery locations in Nepal</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-orange-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveAddress} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider">Add Shipping Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newAddr.fullName}
                onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Province</label>
              <select
                value={newAddr.province}
                onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value, district: NEPAL_DISTRICTS_BY_PROVINCE[e.target.value][0] })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {NEPAL_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">District</label>
              <select
                value={newAddr.district}
                onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Municipality</label>
              <input
                type="text"
                required
                value={newAddr.municipality}
                onChange={(e) => setNewAddr({ ...newAddr, municipality: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ward No.</label>
              <input
                type="text"
                required
                value={newAddr.ward}
                onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                required
                value={newAddr.streetAddress}
                onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-orange-sm transition"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <p className="text-xs text-slate-500">No saved addresses yet.</p>
        ) : (
          addresses.map((addr, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold border border-orange-200">
                    Default
                  </span>
                )}
              </div>
              <p className="text-slate-600">Phone: {addr.phone}</p>
              <p className="text-slate-500">
                {addr.streetAddress}, Ward {addr.ward}, {addr.municipality}, {addr.district}, {addr.province}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
