package com.alarmdashboard.alarm_dashboard_backend.repository;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AlarmRepository extends JpaRepository<AlarmEntity, String> {

    @Query("select a from AlarmEntity a where a.createdAt >= :since order by a.createdAt desc")
    List<AlarmEntity> findSince(@Param("since") Instant since);

    @Query("select a from AlarmEntity a where a.createdAt between :from and :to order by a.createdAt desc")
    List<AlarmEntity> findBetween(@Param("from") Instant from, @Param("to") Instant to);
}