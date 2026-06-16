package com.scm.repository;

import com.scm.entity.PayablePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayablePlanRepository extends JpaRepository<PayablePlan, Long> {
    List<PayablePlan> findByOrderId(Long orderId);
    
    @Query("SELECT p FROM PayablePlan p LEFT JOIN FETCH p.installments WHERE p.order.id = :orderId")
    List<PayablePlan> findByOrderIdWithInstallments(@Param("orderId") Long orderId);
}
