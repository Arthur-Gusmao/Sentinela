package com.sentinela.Sentinela.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MetricsRequest {

    private String hostname;
    private String ip;

    @JsonProperty("os")
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
