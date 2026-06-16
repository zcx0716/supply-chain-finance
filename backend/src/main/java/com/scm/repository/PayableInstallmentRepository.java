package com.scm.repository;

import com.scm.entity.PayableInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PayableInstallmentRepository extends JpaRepository<PayableInstallment, Long> {
}
