package com.alarmdashboard.alarm_dashboard_backend.controller;

import com.alarmdashboard.alarm_dashboard_backend.model.User;
import com.alarmdashboard.alarm_dashboard_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") //Frontend bağlantısı
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public User login(@RequestBody User loginUser) {
        String email = loginUser.getEmail();
        String password = loginUser.getPassword();

        User user = userService.login(email, password);

        if (user != null) {
            return user;
        } else {
            return null;
        }
    }
}

