package com.alarmdashboard.alarm_dashboard_backend.service;

import com.alarmdashboard.alarm_dashboard_backend.model.User;

import java.util.List;

public interface UserService {
    List<User> getAllUsers();
    User getUserById(int id);
    User findByEmailAndPassword(String email, String password);
    User login(String email, String password);
}