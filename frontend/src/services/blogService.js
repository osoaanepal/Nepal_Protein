import api from './api';

export const blogService = {
  // Public Blog Endpoints
  getPosts: async (params = {}) => {
    const response = await api.get('/blog', { params });
    return response.data;
  },

  getFeaturedPosts: async (limit = 4) => {
    const response = await api.get('/blog/featured', { params: { limit } });
    return response.data;
  },

  getPostsByCategory: async (category, params = {}) => {
    const response = await api.get(`/blog/category/${category}`, { params });
    return response.data;
  },

  searchPosts: async (query, params = {}) => {
    const response = await api.get('/blog/search', { params: { q: query, ...params } });
    return response.data;
  },

  getPostBySlug: async (slug) => {
    const response = await api.get(`/blog/${slug}`);
    return response.data;
  },

  // Admin Blog Endpoints
  adminGetPosts: async (params = {}) => {
    const response = await api.get('/admin/blog', { params });
    return response.data;
  },

  adminGetPostById: async (id) => {
    const response = await api.get(`/admin/blog/${id}`);
    return response.data;
  },

  adminCreatePost: async (formData) => {
    const response = await api.post('/admin/blog', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  adminUpdatePost: async (id, formData) => {
    const response = await api.put(`/admin/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  adminDeletePost: async (id) => {
    const response = await api.delete(`/admin/blog/${id}`);
    return response.data;
  },

  adminPublishPost: async (id) => {
    const response = await api.patch(`/admin/blog/${id}/publish`);
    return response.data;
  },

  adminUnpublishPost: async (id) => {
    const response = await api.patch(`/admin/blog/${id}/unpublish`);
    return response.data;
  },

  adminToggleFeatured: async (id) => {
    const response = await api.patch(`/admin/blog/${id}/feature`);
    return response.data;
  },
};
