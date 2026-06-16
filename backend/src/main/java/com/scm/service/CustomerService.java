package com.scm.service;

import com.scm.dto.CustomerDTO;
import com.scm.entity.Customer;
import com.scm.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        return customerRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        Customer customer = new Customer();
        updateCustomerFromDTO(customer, customerDTO);
        Customer savedCustomer = customerRepository.save(customer);
        return convertToDTO(savedCustomer);
    }

    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) return null;
        updateCustomerFromDTO(customer, customerDTO);
        Customer savedCustomer = customerRepository.save(customer);
        return convertToDTO(savedCustomer);
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }

    private void updateCustomerFromDTO(Customer customer, CustomerDTO dto) {
        customer.setName(dto.getName());
        customer.setAddress(dto.getAddress());
        customer.setUnifiedCreditCode(dto.getUnifiedCreditCode());
        customer.setContactPerson(dto.getContactPerson());
        customer.setContactPhone(dto.getContactPhone());
        customer.setRegion(dto.getRegion());
        customer.setIndustry(dto.getIndustry());
    }

    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setAddress(customer.getAddress());
        dto.setUnifiedCreditCode(customer.getUnifiedCreditCode());
        dto.setContactPerson(customer.getContactPerson());
        dto.setContactPhone(customer.getContactPhone());
        dto.setRegion(customer.getRegion());
        dto.setIndustry(customer.getIndustry());
        dto.setCreatedAt(customer.getCreatedAt().format(dateFormatter));
        if (customer.getUpdatedAt() != null) {
            dto.setUpdatedAt(customer.getUpdatedAt().format(dateFormatter));
        }
        return dto;
    }
}
