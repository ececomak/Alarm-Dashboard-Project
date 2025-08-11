package com.alarmdashboard.alarm_dashboard_backend.controller;

import com.alarmdashboard.alarm_dashboard_backend.dto.LoginRequest;
import com.alarmdashboard.alarm_dashboard_backend.dto.LoginResponse;
import com.alarmdashboard.alarm_dashboard_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(userService.login(req));
    }
}