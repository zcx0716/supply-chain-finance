package com.scm.repository;

import com.scm.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByOrderId(Long orderId);
    Optional<Contract> findFirstByOrderId(Long orderId);
}
