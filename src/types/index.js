// Story Protocol Types & Interfaces

// IP Asset Types
export const IPAssetTypes = {
  IMAGE: 'image',
  AUDIO: 'audio', 
  VIDEO: 'video',
  TEXT: 'text',
  CHARACTER: 'character',
  MUSIC: 'music',
  AI_AGENT: 'ai_agent'
};

// Media Types (berdasarkan Story Protocol standard)
export const MediaTypes = {
  // Images
  'image/jpeg': 'JPEG image',
  'image/png': 'PNG image', 
  'image/apng': 'Animated PNG image',
  'image/avif': 'AV1 Image File Format',
  'image/gif': 'GIF image',
  'image/svg+xml': 'SVG image',
  'image/webp': 'WebP image',
  
  // Audio
  'audio/wav': 'WAV audio',
  'audio/mpeg': 'MP3 audio',
  'audio/flac': 'FLAC audio',
  'audio/aac': 'AAC audio',
  'audio/ogg': 'OGG audio',
  'audio/mp4': 'MP4 audio',
  'audio/x-aiff': 'AIFF audio',
  'audio/x-ms-wma': 'WMA audio',
  'audio/opus': 'Opus audio',
  
  // Video
  'video/mp4': 'MP4 video',
  'video/webm': 'WebM video',
  'video/quicktime': 'QuickTime video'
};

// License Types
export const LicenseTypes = {
  OPEN_USE: 'open use',
  COMMERCIAL: 'commercial',
  NON_COMMERCIAL: 'non-commercial',
  DERIVATIVES: 'derivatives',
  ATTRIBUTION: 'attribution',
  SHARE_ALIKE: 'share-alike'
};

// Search Filter Types
export const SearchFilters = {
  MEDIA_TYPE: 'mediaType',
  LICENSE: 'license',
  CREATOR: 'creator',
  DATE_CREATED: 'dateCreated',
  TAGS: 'tags',
  COMMERCIAL_USE: 'commercialUse',
  DERIVATIVES_ALLOWED: 'derivativesAllowed'
};

// IP Creator Type (berdasarkan Story Protocol IPA Metadata Standard)
export const IPCreatorSchema = {
  name: 'string',
  address: 'Address',
  contributionPercent: 'number', // add up to 100
  description: 'string?',
  image: 'string?',
  socialMedia: 'IpCreatorSocial[]?',
  role: 'string?'
};

// IP Creator Social Media Type
export const IPCreatorSocialSchema = {
  platform: 'string',
  url: 'string'
};

// AI Metadata Type (untuk AI Agents)
export const AIMetadataSchema = {
  characterFileUrl: 'string',
  characterFileHash: 'string'
};

// IP Metadata Standard (berdasarkan Story Protocol)
export const IPMetadataSchema = {
  // Required fields
  title: 'string',
  description: 'string',
  createdAt: 'string', // ISO8601 or unix format
  image: 'string',
  imageHash: 'string', // SHA-256 hash
  creators: 'IpCreator[]',
  
  // Commercial infringement check fields
  mediaUrl: 'string?',
  mediaHash: 'string?', // SHA-256 hash
  mediaType: 'string?', // from MediaTypes
  
  // AI Agent fields
  aiMetadata: 'AIMetadata?',
  
  // Optional fields
  ipType: 'string?',
  relationships: 'IpRelationship[]?',
  watermarkImage: 'string?',
  media: 'IpMedia[]?',
  app: 'StoryApp?',
  tags: 'string[]?',
  robotTerms: 'IPRobotTerms?'
};

// Search Query Structure
export const SearchQuerySchema = {
  query: 'string',
  mediaType: 'string?',
  license: 'string?',
  creator: 'string?',
  tags: 'string[]?',
  intent: 'string?',
  filters: 'object?'
};

// Search Result Structure
export const SearchResultSchema = {
  success: 'boolean',
  query: 'string',
  parsedQuery: 'SearchQuery?',
  results: 'IPAsset[]',
  summary: 'string?',
  totalResults: 'number',
  timestamp: 'string'
};

// IP Asset Structure
export const IPAssetSchema = {
  ipId: 'string',
  title: 'string',
  description: 'string',
  mediaType: 'string',
  mediaUrl: 'string',
  creators: 'IpCreator[]',
  licenseTerms: 'LicenseTerms?',
  tags: 'string[]?',
  createdAt: 'string',
  metadata: 'object?'
};

// License Terms Structure (berdasarkan Story Protocol)
export const LicenseTermsSchema = {
  transferable: 'boolean',
  royaltyPolicy: 'Address',
  defaultMintingFee: 'bigint',
  expiration: 'bigint',
  commercialUse: 'boolean',
  commercialAttribution: 'boolean',
  commercializerChecker: 'Address',
  commercializerCheckerData: 'Address',
  commercialRevShare: 'number',
  commercialRevCeiling: 'bigint',
  derivativesAllowed: 'boolean',
  derivativesAttribution: 'boolean',
  derivativesApproval: 'boolean',
  derivativesReciprocal: 'boolean',
  derivativeRevCeiling: 'bigint',
  currency: 'Address',
  uri: 'string'
};

// Error Types
export const ErrorTypes = {
  SEARCH_ERROR: 'SEARCH_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR'
};

// Response Status
export const ResponseStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  NOT_FOUND: 'not_found'
};

// API Endpoints
export const APIEndpoints = {
  STORY_API_BASE: 'https://api.storyapis.com/api/v4',
  SEARCH: '/search',
  IP_ASSETS: '/ip-assets',
  LICENSE_TERMS: '/license-terms',
  METADATA: '/metadata'
};

// Default Values
export const DefaultValues = {
  SEARCH_LIMIT: 20,
  MAX_TAGS: 10,
  DEFAULT_MEDIA_TYPE: null,
  DEFAULT_LICENSE: null,
  CACHE_DURATION: 300000, // 5 minutes in ms
  REQUEST_TIMEOUT: 30000 // 30 seconds
};

// Validation Rules
export const ValidationRules = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 500,
  MAX_TAG_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 2000,
  REQUIRED_FIELDS: ['title', 'description', 'creators'],
  VALID_HASH_LENGTH: 64 // SHA-256 hash length
};

// Helper function untuk validasi media type
export function isValidMediaType(mediaType) {
  return Object.keys(MediaTypes).includes(mediaType);
}

// Helper function untuk validasi license type
export function isValidLicenseType(licenseType) {
  return Object.values(LicenseTypes).includes(licenseType);
}

// Helper function untuk validasi IP Asset
export function validateIPAsset(asset) {
  const errors = [];
  
  if (!asset.title || asset.title.length === 0) {
    errors.push('Title is required');
  }
  
  if (!asset.description || asset.description.length === 0) {
    errors.push('Description is required');
  }
  
  if (!asset.creators || asset.creators.length === 0) {
    errors.push('At least one creator is required');
  }
  
  if (asset.mediaType && !isValidMediaType(asset.mediaType)) {
    errors.push('Invalid media type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function untuk format search results
export function formatSearchResults(rawResults, query) {
  return {
    success: true,
    query,
    results: rawResults.map(result => ({
      ...result,
      formattedCreatedAt: new Date(result.createdAt).toLocaleDateString('id-ID'),
      hasCommercialLicense: result.licenseTerms?.commercialUse || false,
      allowsDerivatives: result.licenseTerms?.derivativesAllowed || false
    })),
    totalResults: rawResults.length,
    timestamp: new Date().toISOString()
  };
}

// Export semua types sebagai default
export default {
  IPAssetTypes,
  MediaTypes,
  LicenseTypes,
  SearchFilters,
  IPCreatorSchema,
  IPCreatorSocialSchema,
  AIMetadataSchema,
  IPMetadataSchema,
  SearchQuerySchema,
  SearchResultSchema,
  IPAssetSchema,
  LicenseTermsSchema,
  ErrorTypes,
  ResponseStatus,
  APIEndpoints,
  DefaultValues,
  ValidationRules,
  isValidMediaType,
  isValidLicenseType,
  validateIPAsset,
  formatSearchResults
};