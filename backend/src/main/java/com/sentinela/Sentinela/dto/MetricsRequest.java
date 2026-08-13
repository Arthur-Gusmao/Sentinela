package com.sentinela.Sentinela.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MetricsRequest {

    @NotBlank
    private String hostname;
    private String ip;
    private String operatingSystem;

    @NotNull
    private Double cpu;

    @NotNull
    private Double ram;

    @NotNull
    private Double disk;

    private Double temperature;
    private Long networkRx;
    private Long networkTx;
}
