package com.scm.controller;

import com.scm.dto.OrderDTO;
import com.scm.dto.PaymentPlanDTO;
import com.scm.service.OrderService;
import com.scm.service.PaymentPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class OrderController {

    private final OrderService orderService;
    private final PaymentPlanService paymentPlanService;

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        OrderDTO order = orderService.getOrderById(id);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/payment-plans")
    public ResponseEntity<Map<String, List<PaymentPlanDTO>>> getOrderPaymentPlans(@PathVariable Long id) {
        Map<String, List<PaymentPlanDTO>> result = new HashMap<>();
        result.put("receivable", paymentPlanService.getReceivablePlansByOrderId(id));
        result.put("payable", paymentPlanService.getPayablePlansByOrderId(id));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO orderDTO) {
        return ResponseEntity.ok(orderService.createOrder(orderDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrder(@PathVariable Long id, @RequestBody OrderDTO orderDTO) {
        OrderDTO order = orderService.updateOrder(id, orderDTO);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}
