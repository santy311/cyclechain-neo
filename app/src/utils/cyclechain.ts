import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { toast } from 'react-hot-toast';
import CONTRACT_ABI from '../../contract_abi.json';
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
        this.web3 = new Web3(window.ethereum as any);
        
        if (!CYCLECHAIN_CONTRACT_ADDRESS) {
          throw new Error('Contract address not configured');
        }

        this.contract = new this.web3.eth.Contract(
          CONTRACT_ABI as AbiItem[],
          CYCLECHAIN_CONTRACT_ADDRESS
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
      
      const details = await this.contract!.methods.getBicycleBasicDetails(tokenId).call();
      
      return {
        frameNumber: details.frameNumber,
        manufacturer: details.manufacturer,
        model: details.model,
        manufactureDate: new Date(Number(details.manufactureDate) * 1000),
        currentOwner: details.owner,
        isStolen: false,
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

      // Handle different response formats
      let tokenIds: number[] = [];
      
      if (Array.isArray(response)) {
        tokenIds = response;
      } else if (typeof response === 'object') {
        // If response is an object with numeric properties
        tokenIds = Object.values(response)
          .filter(value => !isNaN(Number(value)))
          .map(value => Number(value));
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
}

export const cycleChainService = new CycleChainService(); 