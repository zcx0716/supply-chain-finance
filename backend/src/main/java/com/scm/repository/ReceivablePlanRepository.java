package com.scm.repository;

import com.scm.entity.ReceivablePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceivablePlanRepository extends JpaRepository<ReceivablePlan, Long> {
    List<ReceivablePlan> findByOrderId(Long orderId);
    
    @Query("SELECT r FROM ReceivablePlan r LEFT JOIN FETCH r.installments WHERE r.order.id = :orderId")
    List<ReceivablePlan> findByOrderIdWithInstallments(@Param("orderId") Long orderId);
}
