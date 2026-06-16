package com.scm.repository;

import com.scm.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);
    
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.upstreams LEFT JOIN FETCH o.downstreams WHERE o.id = :id")
    Optional<Order> findByIdWithDetails(@Param("id") Long id);
    
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.upstreams LEFT JOIN FETCH o.downstreams")
    List<Order> findAllWithDetails();
    
    List<Order> findByStatus(String status);
}
