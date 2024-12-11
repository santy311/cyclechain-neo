import { ethers, BrowserProvider, JsonRpcSigner, Contract } from 'ethers';
import { toast } from 'react-hot-toast';
import CONTRACT_ABI from '../../contract_abi.json';

// You'll need to replace this with your deployed contract address
const CYCLECHAIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CYCLECHAIN_CONTRACT_ADDRESS;

// Fix the type imports from ethers
export interface Bicycle {
  frameNumber: string;
  manufacturer: string;
  model: string;
  manufactureDate: Date;
  currentOwner: string;
  isStolen: boolean;
  tokenId: number;
}

export interface MaintenanceRecord {
  serviceDescription: string;
  date: Date;
  serviceProvider: string;
  notes: string;
}

export interface ComponentChange {
  componentType: string;
  newComponentDetails: string;
  date: Date;
  installedBy: string;
}

export class CycleChainService {
  private contract: Contract | null = null;
  // Update provider and signer types for ethers v6
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  constructor() {
    this.initializeContract();
  }

  private async initializeContract() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Use BrowserProvider directly from ethers
        this.provider = new BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // Make sure contract address exists
        if (!CYCLECHAIN_CONTRACT_ADDRESS) {
          throw new Error('Contract address not configured');
        }

        this.contract = new Contract(
          CYCLECHAIN_CONTRACT_ADDRESS,
          CONTRACT_ABI,
          this.signer
        );
      }
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      toast.error('Failed to connect to blockchain');
    }
  }

  async getBicycleDetails(tokenId: number): Promise<Bicycle | null> {
    try {
      if (!this.contract) await this.initializeContract();
      
      // Update to use the correct function from the ABI
      const details = await this.contract!.getBicycleBasicDetails(tokenId);
      
      return {
        frameNumber: details.frameNumber,
        manufacturer: details.manufacturer,
        model: details.model,
        manufactureDate: new Date(details.manufactureDate.toNumber() * 1000), // Convert BigNumber to Date
        currentOwner: details.owner,
        isStolen: false, // Note: Add this if needed from another contract call
        tokenId: tokenId
      };
    } catch (error) {
      console.error('Error fetching bicycle details:', error);
      toast.error('Failed to fetch bicycle details');
      return null;
    }
  }

  async reportStolen(tokenId: number): Promise<boolean> {
    try {
      if (!this.contract) await this.initializeContract();
      
      const tx = await this.contract!.reportStolen(tokenId);
      await tx.wait();
      
      toast.success('Bicycle reported as stolen');
      return true;
    } catch (error) {
      console.error('Error reporting bicycle as stolen:', error);
      toast.error('Failed to report bicycle as stolen');
      return false;
    }
  }

  async addMaintenanceRecord(
    tokenId: number,
    serviceDescription: string,
    notes: string
  ): Promise<boolean> {
    try {
      if (!this.contract) await this.initializeContract();
      
      const tx = await this.contract!.addMaintenanceRecord(
        tokenId,
        serviceDescription,
        notes
      );
      await tx.wait();
      
      toast.success('Maintenance record added successfully');
      return true;
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast.error('Failed to add maintenance record');
      return false;
    }
  }

  async addComponentChange(
    tokenId: number,
    componentType: string,
    newComponentDetails: string
  ): Promise<boolean> {
    try {
      if (!this.contract) await this.initializeContract();
      
      const tx = await this.contract!.addComponentChange(
        tokenId,
        componentType,
        newComponentDetails
      );
      await tx.wait();
      
      toast.success('Component change recorded successfully');
      return true;
    } catch (error) {
      console.error('Error recording component change:', error);
      toast.error('Failed to record component change');
      return false;
    }
  }
}

// Export a singleton instance
export const cycleChainService = new CycleChainService(); 