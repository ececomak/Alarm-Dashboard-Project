package com.alarmdashboard.alarm_dashboard_backend.service;

import com.alarmdashboard.alarm_dashboard_backend.dto.LoginRequest;
import com.alarmdashboard.alarm_dashboard_backend.dto.LoginResponse;

public interface UserService {
    LoginResponse login(LoginRequest request);
}