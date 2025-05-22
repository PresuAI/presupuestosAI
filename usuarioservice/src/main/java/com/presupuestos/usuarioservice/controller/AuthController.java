package com.presupuestos.usuarioservice.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {

    @GetMapping("/auth/google")
    public String googleLogin() {
        return "redirect:/oauth2/authorization/google";
    }
}