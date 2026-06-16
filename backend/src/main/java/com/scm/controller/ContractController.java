package com.scm.controller;

import com.scm.dto.CustomerDTO;
import com.scm.entity.Contract;
import com.scm.service.ContractService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Contract>> getContractsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(contractService.getContractsByOrderId(orderId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable Long id) {
        Contract contract = contractService.getContractById(id);
        return contract != null ? ResponseEntity.ok(contract) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadContract(@PathVariable Long id) {
        byte[] fileData = contractService.getContractFile(id);
        if (fileData == null) {
            return ResponseEntity.notFound().build();
        }

        Contract contract = contractService.getContractById(id);
        String fileName = contract != null ? contract.getFileName() : "contract.docx";

        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .contentLength(fileData.length)
                .body(fileData);
    }

    @PostMapping
    public ResponseEntity<Contract> createContract(@RequestBody CreateContractRequest request) {
        Contract contract = contractService.createContract(
                request.getOrderId(),
                request.getTemplateName(),
                request.getTemplateContent());
        return contract != null ? ResponseEntity.ok(contract) : ResponseEntity.badRequest().build();
    }

    @Data
    public static class CreateContractRequest {
        private Long orderId;
        private String templateName;
        private String templateContent;
    }
}
