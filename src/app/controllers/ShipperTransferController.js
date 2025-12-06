// ============= SHIPPER-SPECIFIC TRANSFER METHODS =============

const Transfer = require("../models/Transfer");
const User = require("../models/User");

// === DEBUG FUNCTION ===
exports.debugAllTransfers = async (req, res) => {
  try {
    const shipperId = req.session.user._id;
    console.log(`🐛 [DEBUG] Checking all transfers for shipper ${shipperId}`);

    // Lấy tất cả transfers của shipper này
    const allTransfers = await Transfer.find({ assignedShipper: shipperId })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("assignedShipper");

    console.log(
      `📊 [DEBUG] Tổng số transfers cho shipper ${shipperId}: ${allTransfers.length}`
    );

    const statusBreakdown = {};
    allTransfers.forEach((t) => {
      const status = t.status;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      console.log(
        `   - ${t.transferId || t._id}: ${status} | ${t.sourceWarehouse?.name} → ${t.destinationWarehouse?.name}`
      );
    });

    console.log(`📊 [DEBUG] Phân bố theo status:`, statusBreakdown);

    // Cũng kiểm tra tất cả transfers không phân biệt shipper
    const allTransfersInDb = await Transfer.find({}).populate(
      "assignedShipper",
      "name email"
    );

    console.log(
      `📊 [DEBUG] Tổng số transfers trong DB: ${allTransfersInDb.length}`
    );
    allTransfersInDb.forEach((t) => {
      console.log(
        `   - ${t.transferId || t._id}: ${t.status} | Shipper: ${t.assignedShipper?.name || "Chưa gán"}`
      );
    });

    res.json({
      success: true,
      data: {
        shipperTransfers: allTransfers,
        allTransfers: allTransfersInDb,
        statusBreakdown,
      },
      message: `Debug completed. Found ${allTransfers.length} transfers for this shipper.`,
    });
  } catch (error) {
    console.error("❌ Debug transfers error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Shipper xem danh sách phiếu điều chuyển đang sắp xếp
exports.shipperShowPendingTransfers = async (req, res) => {
  try {
    const shipperId = req.session.user._id;
    console.log(
      `🔍 [DEBUG] Shipper ${shipperId} đang tìm transfers với status "Đang sắp xếp"`
    );

    const transfers = await Transfer.find({
      assignedShipper: shipperId,
      status: "Đang sắp xếp",
    })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .sort({ createdAt: -1 });

    console.log(
      `📦 [DEBUG] Tìm thấy ${transfers.length} transfers đang sắp xếp cho shipper ${shipperId}`
    );
    transfers.forEach((t) => {
      console.log(
        `   - Transfer ${t.transferId || t._id}: ${t.sourceWarehouse?.name} → ${t.destinationWarehouse?.name}`
      );
    });

    res.render("shipper/transfers_dang_sap_xep", {
      transfers,
      hasOptimizedTransfers: transfers.some((t) => t.routeOrder > 0),
      optimizedCount: transfers.filter((t) => t.routeOrder > 0).length,
    });
  } catch (error) {
    console.error("Lỗi khi lấy phiếu điều chuyển đang sắp xếp:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// Shipper xem danh sách phiếu điều chuyển đang vận chuyển
exports.shipperShowActiveTransfers = async (req, res) => {
  try {
    const shipperId = req.session.user._id;
    console.log(
      `🔍 [DEBUG] Shipper ${shipperId} đang tìm transfers với status "Đang vận chuyển"`
    );

    const transfers = await Transfer.find({
      assignedShipper: shipperId,
      status: "Đang vận chuyển",
    })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .sort({ routeOrder: 1, createdAt: 1 });

    console.log(
      `🚛 [DEBUG] Tìm thấy ${transfers.length} transfers đang vận chuyển cho shipper ${shipperId}`
    );
    transfers.forEach((t) => {
      console.log(
        `   - Transfer ${t.transferId || t._id}: ${t.sourceWarehouse?.name} → ${t.destinationWarehouse?.name} (routeOrder: ${t.routeOrder || 0})`
      );
    });

    res.render("shipper/transfers_dang_van_chuyen", { transfers });
  } catch (error) {
    console.error("Lỗi khi lấy phiếu điều chuyển đang vận chuyển:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// Shipper xem danh sách phiếu điều chuyển đã giao
exports.shipperShowCompletedTransfers = async (req, res) => {
  try {
    const shipperId = req.session.user._id;

    const transfers = await Transfer.find({
      assignedShipper: shipperId,
      status: "Đã giao",
    })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .sort({ updatedAt: -1 });

    res.render("shipper/transfers_da_giao", { transfers });
  } catch (error) {
    console.error("Lỗi khi lấy phiếu điều chuyển đã giao:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// Shipper xem chi tiết phiếu điều chuyển
exports.shipperViewTransferDetail = async (req, res) => {
  try {
    const transferId = req.params.id;
    const shipperId = req.session.user._id;

    const transfer = await Transfer.findById(transferId)
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("assignedShipper")
      .populate("items.productId");

    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    // Check if transfer belongs to this shipper
    if (
      transfer.assignedShipper &&
      transfer.assignedShipper._id.toString() !== shipperId.toString()
    ) {
      return res
        .status(403)
        .send("Bạn không có quyền xem phiếu điều chuyển này.");
    }

    res.render("shipper/transfer_detail", { transfer });
  } catch (error) {
    console.error("Lỗi khi xem chi tiết phiếu điều chuyển:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// Shipper xác nhận nhận phiếu điều chuyển
exports.shipperConfirmTransfer = async (req, res) => {
  try {
    const transferId = req.params.id;
    const shipperId = req.session.user._id;

    const transfer = await Transfer.findById(transferId);
    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    if (transfer.status !== "Đang sắp xếp") {
      return res
        .status(400)
        .send("Phiếu điều chuyển không ở trạng thái có thể nhận.");
    }

    // Update status to "Đang vận chuyển"
    transfer.assignedShipper = shipperId;
    transfer.status = "Đang vận chuyển";
    await transfer.save();

    console.log(
      `✅ Shipper ${shipperId} đã nhận phiếu điều chuyển ${transferId}`
    );

    res.redirect(req.get("referer") || "/shipper/transfers/dang-sap-xep");
  } catch (error) {
    console.error("Lỗi khi xác nhận phiếu điều chuyển:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// Shipper đánh dấu phiếu điều chuyển đã giao với inventory management
exports.shipperMarkTransferDelivered = async (req, res) => {
  try {
    const transferId = req.params.id;
    const shipperId = req.session.user._id;

    const transfer = await Transfer.findById(transferId)
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("items.productId");

    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    if (transfer.assignedShipper.toString() !== shipperId.toString()) {
      return res
        .status(403)
        .send("Bạn không có quyền cập nhật phiếu điều chuyển này.");
    }

    if (transfer.status !== "Đang vận chuyển") {
      return res
        .status(400)
        .send("Phiếu điều chuyển không ở trạng thái có thể giao.");
    }

    // === INVENTORY MANAGEMENT: UPDATE WAREHOUSE STOCK ===
    const sourceWarehouse = transfer.sourceWarehouse;
    const destinationWarehouse = transfer.destinationWarehouse;

    console.log(`🔄 Processing inventory update for transfer ${transferId}`);
    console.log(
      `   From: ${sourceWarehouse.name} To: ${destinationWarehouse.name}`
    );

    // Process each item in the transfer
    for (const item of transfer.items) {
      const productId = item.productId._id;
      const quantity = item.quantity;

      console.log(
        `📦 Processing product ${item.productId.name}: ${quantity} units`
      );

      // Remove from source warehouse
      const sourceProductIndex = sourceWarehouse.products.findIndex(
        (p) => p.productId.toString() === productId.toString()
      );

      if (sourceProductIndex >= 0) {
        const currentSourceQty =
          sourceWarehouse.products[sourceProductIndex].quantity;
        sourceWarehouse.products[sourceProductIndex].quantity = Math.max(
          0,
          currentSourceQty - quantity
        );
        console.log(
          `   ➖ Source ${sourceWarehouse.name}: ${currentSourceQty} → ${sourceWarehouse.products[sourceProductIndex].quantity}`
        );
      }

      // Add to destination warehouse
      const destProductIndex = destinationWarehouse.products.findIndex(
        (p) => p.productId.toString() === productId.toString()
      );

      if (destProductIndex >= 0) {
        // Product exists in destination, increase quantity
        const currentDestQty =
          destinationWarehouse.products[destProductIndex].quantity;
        destinationWarehouse.products[destProductIndex].quantity += quantity;
        console.log(
          `   ➕ Dest ${destinationWarehouse.name}: ${currentDestQty} → ${destinationWarehouse.products[destProductIndex].quantity}`
        );
      } else {
        // Product doesn't exist in destination, add new entry
        destinationWarehouse.products.push({
          productId: productId,
          quantity: quantity,
        });
        console.log(
          `   ➕ Added new product to ${destinationWarehouse.name}: ${quantity} units`
        );
      }
    }

    // Save warehouse changes
    await sourceWarehouse.save();
    await destinationWarehouse.save();

    // Update transfer status
    transfer.status = "Đã giao";
    transfer.deliveredAt = new Date();
    await transfer.save();

    console.log(`✅ Transfer ${transferId} completed with inventory updates`);

    res.redirect(`/shipper/transfers/${transferId}`);
  } catch (error) {
    console.error("Lỗi khi đánh dấu phiếu điều chuyển đã giao:", error);
    res.status(500).send("Lỗi hệ thống!");
  }
};

// === MANUAL ROUTE OPTIMIZATION FOR TRANSFERS ===
exports.optimizeMyTransferRoute = async (req, res) => {
  try {
    const shipperId = req.session.user._id;

    console.log(
      `🔄 Manual transfer route optimization requested by shipper ${shipperId}`
    );

    // Only optimize "Đang vận chuyển" transfers
    const transfersToOptimize = await Transfer.find({
      assignedShipper: shipperId,
      status: "Đang vận chuyển", // CHỈ tối ưu transfers đang vận chuyển
    })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse");

    if (transfersToOptimize.length === 0) {
      return res.json({
        success: true,
        message: "Không có phiếu điều chuyển 'Đang vận chuyển' nào cần tối ưu",
        optimizedCount: 0,
      });
    }

    if (transfersToOptimize.length === 1) {
      // Only one transfer - just set routeOrder = 1
      const singleTransfer = transfersToOptimize[0];
      singleTransfer.routeOrder = 1;
      singleTransfer.optimizedAt = new Date();
      await singleTransfer.save();

      return res.json({
        success: true,
        message: "Đã tối ưu phiếu điều chuyển duy nhất",
        optimizedCount: 1,
      });
    }

    // Get shipper's warehouse (use first transfer's source as starting point)
    const startWarehouse = transfersToOptimize[0].sourceWarehouse;
    if (!startWarehouse || !startWarehouse.location) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin kho xuất phát",
      });
    }

    console.log(`📍 Starting warehouse: ${startWarehouse.name}`);

    // Prepare coordinates for optimization (use destination warehouses)
    const points = [
      {
        latitude: startWarehouse.location.latitude,
        longitude: startWarehouse.location.longitude,
      },
    ];

    const validTransfers = [];
    transfersToOptimize.forEach((transfer) => {
      const destWarehouse = transfer.destinationWarehouse;
      if (
        destWarehouse?.location?.latitude &&
        destWarehouse?.location?.longitude
      ) {
        points.push({
          latitude: destWarehouse.location.latitude,
          longitude: destWarehouse.location.longitude,
        });
        validTransfers.push(transfer);
      } else {
        console.warn(
          `⚠️ Transfer ${transfer._id} missing destination coordinates`
        );
      }
    });

    if (validTransfers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Các phiếu điều chuyển thiếu tọa độ kho đích. Liên hệ admin để cập nhật.",
      });
    }

    console.log(`🗺️ Building distance matrix for ${points.length} points...`);

    // Get distance matrix from OSRM
    const { getDistanceMatrix } = require("../../util/mapService");
    const distanceMatrix = await getDistanceMatrix(points);

    if (!distanceMatrix) {
      return res.status(500).json({
        success: false,
        message: "Lỗi tính toán khoảng cách. Vui lòng thử lại sau.",
      });
    }

    // Solve VRP using Nearest Neighbor
    const vrpService = require("../../services/VRPService");
    const routeIndices = vrpService.solveNearestNeighbor(distanceMatrix);

    // Update routeOrder based on optimized route
    console.log("🎯 Optimized route indices:", routeIndices);

    // Reset all routeOrder first
    for (const transfer of validTransfers) {
      transfer.routeOrder = 0;
    }

    // Apply new route order
    let routePosition = 1;
    for (let i = 0; i < routeIndices.length; i++) {
      const index = routeIndices[i];
      if (index === 0) continue; // Skip warehouse (index 0)

      const transferToUpdate = validTransfers[index - 1];
      transferToUpdate.routeOrder = routePosition;
      transferToUpdate.optimizedAt = new Date();
      await transferToUpdate.save();

      console.log(
        `📦 Transfer ${transferToUpdate.transferId} → Position ${routePosition}`
      );
      routePosition++;
    }

    // Return success response
    res.json({
      success: true,
      message: `Đã tối ưu ${validTransfers.length} phiếu điều chuyển 'Đang vận chuyển' thành công!`,
      optimizedCount: validTransfers.length,
      route: routeIndices,
    });
  } catch (error) {
    console.error("❌ Manual transfer optimization error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tối ưu lộ trình: " + error.message,
    });
  }
};
