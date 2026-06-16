package com.scm.repository;

import com.scm.entity.ReceivableInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReceivableInstallmentRepository extends JpaRepository<ReceivableInstallment, Long> {
}
