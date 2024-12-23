import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { toast } from 'react-hot-toast';
import CONTRACT_ABI_IMPORT from '../abi/CycleChain.json';
const CONTRACT_ABI = CONTRACT_ABI_IMPORT.abi;
import { AbiItem } from 'web3-utils';

const CYCLECHAIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CYCLECHAIN_CONTRACT_ADDRESS;

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
  private web3: Web3 | null = null;

  constructor() {
    this.initializeContract();
  }

  private async initializeContract() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = window.ethereum;
        this.web3 = new Web3(provider as any);
        
        if (!CYCLECHAIN_CONTRACT_ADDRESS) {
          throw new Error('Contract address not configured');
        }

        if (!CONTRACT_ABI || !Array.isArray(CONTRACT_ABI)) {
          console.error('Invalid ABI:', CONTRACT_ABI);
          throw new Error('Invalid contract ABI format');
        }

        this.contract = new this.web3.eth.Contract(
          CONTRACT_ABI as AbiItem[],
          CYCLECHAIN_CONTRACT_ADDRESS
        );
      }
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      toast.error('Failed to connect to blockchain');
    }
  }

  async getBicycleDetails(tokenId: number): Promise<Bicycle | null> {
    try {
      if (!this.contract) await this.initializeContract();
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // First check if the token exists
      try {
        const exists = await this.contract.methods.ownerOf(tokenId).call();
        if (!exists) {
          return null;
        }
      } catch (error) {
        return null;
      }
      
      try {
        // Try getting basic details
        const details = await this.contract.methods.getBicycleBasicDetails(tokenId).call();
        
        return {
          frameNumber: details.frameNumber || '',
          manufacturer: details.manufacturer || '',
          model: details.model || '',
          manufactureDate: new Date(Number(details.manufactureDate || 0) * 1000),
          currentOwner: details.owner || '',
          isStolen: Boolean(details.isStolen || false),
          tokenId: tokenId
        };
      } catch (error: any) {
        // Try alternative method name if it exists
        try {
          const details = await this.contract.methods.bicycles(tokenId).call();
          
          return {
            frameNumber: details.frameNumber || '',
            manufacturer: details.manufacturer || '',
            model: details.model || '',
            manufactureDate: new Date(Number(details.manufactureDate || 0) * 1000),
            currentOwner: details.owner || '',
            isStolen: Boolean(details.isStolen || false),
            tokenId: tokenId
          };
        } catch (alternativeError) {
          throw error;
        }
      }
    } catch (error: any) {
      if (error.message.includes('execution reverted')) {
        toast.error('This bicycle token does not exist');
      } else {
        toast.error('Failed to fetch bicycle details');
      }
      return null;
    }
  }

  async reportStolen(tokenId: number): Promise<boolean> {
    try {
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const tx = await this.contract!.methods.reportStolen(tokenId).send({
        from: accounts[0]
      });
      
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
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const tx = await this.contract!.methods.addMaintenanceRecord(
        tokenId,
        serviceDescription,
        notes
      ).send({
        from: accounts[0]
      });
      
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
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const tx = await this.contract!.methods.addComponentChange(
        tokenId,
        componentType,
        newComponentDetails
      ).send({
        from: accounts[0]
      });
      
      toast.success('Component change recorded successfully');
      return true;
    } catch (error) {
      console.error('Error recording component change:', error);
      toast.error('Failed to record component change');
      return false;
    }
  }

  async getOwnedBicycles(): Promise<Bicycle[]> {
    try {
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      
      console.log("Fetching bicycles for account:", accounts[0]);
      

      const response = await this.contract!.methods.getOwnedBicycles(accounts[0]).call();
      
      console.log("Raw response:", response);

      // Extract token IDs from the response
      let tokenIds: number[] = [];
      
      if (response.tokenIds && Array.isArray(response.tokenIds)) {
        // If the response has a tokenIds array property
        tokenIds = response.tokenIds.map((id: string | number) => Number(id));
      } else if (Array.isArray(response)) {
        // If the response is directly an array
        tokenIds = response.map((id: string | number) => Number(id));
      }
      
      console.log("Processed token IDs:", tokenIds);
      
      // Map the token IDs to bicycle details
      const bicyclesPromises = tokenIds.map(async (tokenId) => {
        try {
          return await this.getBicycleDetails(tokenId);
        } catch (error) {
          console.error(`Error fetching details for token ${tokenId}:`, error);
          return null;
        }
      });
      
      const bicycles = await Promise.all(bicyclesPromises);
      
      // Filter out any null results
      return bicycles.filter((bike): bike is Bicycle => bike !== null);
    } catch (error) {
      console.error('Error fetching owned bicycles:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      toast.error('Failed to fetch owned bicycles');
      return [];
    }
  }

  async transferBicycle(tokenId: number, newOwner: string): Promise<boolean> {
    try {
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const tx = await this.contract!.methods.transferFrom(
        accounts[0],
        newOwner,
        tokenId
      ).send({
        from: accounts[0]
      });
      
      toast.success('Bicycle transferred successfully');
      return true;
    } catch (error) {
      console.error('Error transferring bicycle:', error);
      toast.error('Failed to transfer bicycle');
      return false;
    }
  }

  async getMaintenanceHistory(tokenId: number): Promise<MaintenanceRecord[]> {
    try {
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const records = await this.contract!.methods.getMaintenanceHistory(tokenId).call({
        from: accounts[0]
      });
      
      return records.map((record: any) => ({
        serviceDescription: record.serviceDescription,
        date: new Date(Number(record.date) * 1000),
        serviceProvider: record.serviceProvider,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      toast.error('Failed to fetch maintenance history');
      return [];
    }
  }

  async getComponentChanges(tokenId: number): Promise<ComponentChange[]> {
    try {
      if (!this.contract || !this.web3) await this.initializeContract();
      
      const accounts = await this.web3!.eth.getAccounts();
      const changes = await this.contract!.methods.getComponentHistory(tokenId).call({
        from: accounts[0]
      });
      
      return changes.map((change: any) => ({
        componentType: change.componentType,
        newComponentDetails: change.newComponentDetails,
        date: new Date(Number(change.date) * 1000),
        installedBy: change.installedBy
      }));
    } catch (error) {
      console.error('Error fetching component changes:', error);
      toast.error('Failed to fetch component changes');
      return [];
    }
  }

  async registerBicycle(
    frameNumber: string,
    manufacturer: string,
    model: string
  ): Promise<void> {
    if (!this.contract || !this.web3) await this.initializeContract();
    
    try {
      const accounts = await this.web3!.eth.getAccounts();
      
      // Generate a unique proof by combining bicycle details with a timestamp and manufacturer's address
      const proofData = JSON.stringify({
        frameNumber,
        manufacturer,
        model,
        timestamp: Date.now(),
        manufacturerAddress: accounts[0]
      });
      
      // Create a bytes32 hash of the proof data
      const proofBytes32 = this.web3!.utils.sha3(proofData);
      if (!proofBytes32) {
        throw new Error("Failed to generate proof hash");
      }

      console.log("Proof bytes32:", proofBytes32);
      await this.contract!.methods.registerBicycle(
        frameNumber,
        manufacturer,
        model,
        proofBytes32
      ).send({
        from: accounts[0]
      });
      
      toast.success('Bicycle registered successfully');
    } catch (error) {
      console.error("Error registering bicycle:", error);
      toast.error('Failed to register bicycle');
      throw error;
    }
  }
}

export const cycleChainService = new CycleChainService(); 