/**
 * Wallets API - B1 Wallet Profile endpoints
 */
import { api } from './client';

/**
 * Get wallet profile by address
 * @param {string} address - Wallet address
 * @param {string} chain - Chain name (default: Ethereum)
 */
export const getProfile = async (address, chain = 'Ethereum') => {
  const response = await api.get(`/wallets/${address}`, {
    params: { chain },
  });
  return response.data;
};

/**
 * Build or refresh wallet profile
 * @param {Object} data - Raw wallet data including transactions
 */
export const buildProfile = async (data) => {
  const response = await api.post('/wallets/profile', data);
  return response.data;
};

/**
 * Search wallets by tags
 * @param {string[]} tags - Array of tags to filter by
 * @param {number} limit - Max results
 */
export const searchByTags = async (tags, limit = 50) => {
  const response = await api.get('/wallets/search', {
    params: { 
      tags: tags.join(','),
      limit,
    },
  });
  return response.data;
};

/**
 * Get high-volume wallets
 * @param {number} limit - Max results
 */
export const getHighVolumeWallets = async (limit = 20) => {
  const response = await api.get('/wallets/high-volume', {
    params: { limit },
  });
  return response.data;
};

/**
 * Get available wallet tags
 */
export const getTags = async () => {
  const response = await api.get('/wallets/tags');
  return response.data;
};
