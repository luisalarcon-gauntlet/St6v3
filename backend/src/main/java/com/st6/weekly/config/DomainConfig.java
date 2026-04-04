package com.st6.weekly.config;

import com.st6.weekly.domain.cycle.CycleStateMachine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainConfig {

    @Bean
    public CycleStateMachine cycleStateMachine() {
        return new CycleStateMachine();
    }
}
