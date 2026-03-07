import { Request, Response } from "express";
import { ContractRequest, User, Room } from "../models";
import { Types } from "mongoose";

// GET /api/contracts/landlord - Get all contract requests for landlord
export const getLandlordContracts = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`📋 Fetching contracts for landlord: ${landlordId}`);

    const contracts = await ContractRequest.find({ landlordId }).sort({
      createdAt: -1,
    });

    console.log(`✅ Found ${contracts.length} contract requests`);

    res.json({
      contracts: contracts.map((c) => ({
        id: c._id,
        tenantName: c.tenantInfo.fullName,
        tenantEmail: c.tenantInfo.email,
        tenantPhone: c.tenantInfo.phone,
        roomTitle: c.roomInfo.title,
        roomPrice: c.roomInfo.price,
        requestDate: c.createdAt,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error("❌ Get contracts error:", error);
    res.status(500).json({ error: "Failed to get contracts" });
  }
};

// GET /api/contracts/:id - Get contract details
export const getContractDetail = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;
    const { id } = req.params;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`📄 Getting contract details: ${id}`);

    const contract = await ContractRequest.findById(id);

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    // Verify landlord owns this contract
    if (contract.landlordId.toString() !== landlordId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ contract });
  } catch (error) {
    console.error("❌ Get contract detail error:", error);
    res.status(500).json({ error: "Failed to get contract details" });
  }
};

// POST /api/contracts/:id/approve - Approve contract request
export const approveContract = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;
    const { id } = req.params;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`✅ Approving contract: ${id}`);

    const contract = await ContractRequest.findById(id);

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    // Verify landlord owns this contract
    if (contract.landlordId.toString() !== landlordId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Update status
    contract.status = "approved";
    await contract.save();

    console.log(`✅ Contract approved: ${contract._id}`);

    res.json({
      message: "Contract approved",
      contract: {
        id: contract._id,
        status: contract.status,
      },
    });
  } catch (error) {
    console.error("❌ Approve contract error:", error);
    res.status(500).json({ error: "Failed to approve contract" });
  }
};

// POST /api/contracts/:id/reject - Reject contract request
export const rejectContract = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`❌ Rejecting contract: ${id}, Reason: ${reason}`);

    const contract = await ContractRequest.findById(id);

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    // Verify landlord owns this contract
    if (contract.landlordId.toString() !== landlordId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Update status
    contract.status = "rejected";
    contract.rejectionReason = reason;
    await contract.save();

    console.log(`✅ Contract rejected: ${contract._id}`);

    res.json({
      message: "Contract rejected",
      contract: {
        id: contract._id,
        status: contract.status,
      },
    });
  } catch (error) {
    console.error("❌ Reject contract error:", error);
    res.status(500).json({ error: "Failed to reject contract" });
  }
};

// POST /api/contracts/request - Create contract request (Tenant side)
export const createContractRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).userId;
    const { roomId } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    console.log(`📝 Creating contract request - Tenant: ${tenantId}, Room: ${roomId}`);

    // Get tenant info
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Get room info
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    // Check if contract request already exists
    const existingRequest = await ContractRequest.findOne({
      tenantId,
      roomId,
      status: "pending",
    });

    if (existingRequest) {
      res
        .status(400)
        .json({ error: "You already have a pending request for this room" });
      return;
    }

    // Create contract request
    const contractRequest = new ContractRequest({
      tenantId: new Types.ObjectId(tenantId),
      landlordId: room.landlordId,
      roomId: new Types.ObjectId(roomId),
      tenantInfo: {
        tenantId: new Types.ObjectId(tenantId),
        email: tenant.email,
        fullName: tenant.fullName,
        phone: tenant.phone,
        university: tenant.university,
      },
      roomInfo: {
        roomId: new Types.ObjectId(roomId),
        title: room.title,
        address: room.address,
        district: room.district,
        price: room.price,
        deposit: room.deposit,
      },
      status: "pending",
    });

    await contractRequest.save();

    console.log(`✅ Contract request created: ${contractRequest._id}`);

    res.status(201).json({
      message: "Contract request sent successfully",
      contractRequest: contractRequest._id,
    });
  } catch (error) {
    console.error("❌ Create contract request error:", error);
    res.status(500).json({ error: "Failed to create contract request" });
  }
};
