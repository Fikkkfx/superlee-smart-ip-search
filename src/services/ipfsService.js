import axios from "axios";

export class IPFSService {
  constructor() {
    this.pinataJWT = process.env.PINATA_JWT;
    this.pinataBaseUrl = "https://api.pinata.cloud";
  }

  // Upload file to IPFS via Pinata
  async uploadFile(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataMetadata = JSON.stringify({
        name: metadata.name || 'IP Asset',
        keyvalues: metadata.keyvalues || {}
      });
      formData.append('pinataMetadata', pinataMetadata);

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  // Upload JSON metadata to IPFS
  async uploadJSON(jsonData, name = 'metadata') {
    try {
      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
        jsonData,
        {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (error) {
      console.error("Error uploading JSON to IPFS:", error);
      throw error;
    }
  }

  // Get file from IPFS
  async getFile(ipfsHash) {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error("Error getting file from IPFS:", error);
      throw error;
    }
  }
}