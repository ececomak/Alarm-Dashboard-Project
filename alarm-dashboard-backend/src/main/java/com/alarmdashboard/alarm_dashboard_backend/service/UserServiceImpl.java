package com.alarmdashboard.alarm_dashboard_backend.service;

import com.alarmdashboard.alarm_dashboard_backend.dto.LoginRequest;
import com.alarmdashboard.alarm_dashboard_backend.dto.LoginResponse;
import com.alarmdashboard.alarm_dashboard_backend.model.User;
import com.alarmdashboard.alarm_dashboard_backend.repository.UserRepository;
import com.alarmdashboard.alarm_dashboard_backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public UserServiceImpl(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!String.valueOf(user.getPassword()).equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials");
        }

        String roleUpper = user.getRole() != null ? user.getRole().toUpperCase(Locale.ROOT) : "USER";

        String token = jwtService.generate(user.getEmail(), roleUpper);

        return new LoginResponse(token, user.getEmail(), roleUpper);
    }
}