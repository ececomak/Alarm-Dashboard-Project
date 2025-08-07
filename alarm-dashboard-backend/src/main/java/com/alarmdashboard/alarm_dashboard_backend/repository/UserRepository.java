package com.alarmdashboard.alarm_dashboard_backend.repository;

import com.alarmdashboard.alarm_dashboard_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmailAndPassword(String email, String password);
}
