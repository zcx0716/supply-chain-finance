package com.scm.controller;

import lombok.Data;
import com.scm.service.PaymentPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment-plans")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PaymentPlanController {

    private final PaymentPlanService paymentPlanService;

    @PutMapping("/receivable/{planId}/installments/{installmentId}")
    public ResponseEntity<Void> updateReceivableInstallment(
            @PathVariable Long planId,
            @PathVariable Long installmentId,
            @RequestBody UpdateInstallmentRequest request) {
        paymentPlanService.updateReceivableInstallmentStatus(planId, installmentId, request.getStatus(), request.getNotes());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/payable/{planId}/installments/{installmentId}")
    public ResponseEntity<Void> updatePayableInstallment(
            @PathVariable Long planId,
            @PathVariable Long installmentId,
            @RequestBody UpdateInstallmentRequest request) {
        paymentPlanService.updatePayableInstallmentStatus(planId, installmentId, request.getStatus(), request.getNotes());
        return ResponseEntity.ok().build();
    }

    @Data
    public static class UpdateInstallmentRequest {
        private String status;
        private String notes;
    }
}
