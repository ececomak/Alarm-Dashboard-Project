package com.alarmdashboard.alarm_dashboard_backend.config;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.service.AlarmIngestService;
import com.alarmdashboard.alarm_dashboard_backend.source.mqtt.MqttAlarmMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import java.util.Optional;

@Configuration
@EnableConfigurationProperties(RealtimeSourceConfig.MqttProps.class)
@ConditionalOnProperty(name = "realtime.source", havingValue = "mqtt")
public class RealtimeSourceConfig {
    private static final Logger log = LoggerFactory.getLogger(RealtimeSourceConfig.class);

    @Bean
    @ConditionalOnMissingBean
    public MqttAlarmMapper mqttAlarmMapper(ObjectMapper om) {
        return new MqttAlarmMapper(om);
    }

    @Bean
    public MqttPahoClientFactory mqttClientFactory(MqttProps props) {
        DefaultMqttPahoClientFactory f = new DefaultMqttPahoClientFactory();
        MqttConnectOptions opts = new MqttConnectOptions();

        if (props.brokerUrl() != null) opts.setServerURIs(new String[]{props.brokerUrl()});
        if (props.username() != null && !props.username().isBlank()) opts.setUserName(props.username());
        if (props.password() != null && !props.password().isBlank()) opts.setPassword(props.password().toCharArray());

        opts.setAutomaticReconnect(true);
        opts.setKeepAliveInterval(Optional.ofNullable(props.keepAlive()).orElse(30));
        opts.setConnectionTimeout(Optional.ofNullable(props.connectionTimeout()).orElse(10));
        opts.setCleanSession(Optional.ofNullable(props.cleanSession()).orElse(false)); // offline almak için

        f.setConnectionOptions(opts);
        return f;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MqttPahoMessageDrivenChannelAdapter mqttInboundAdapter(
            MqttProps props,
            MqttPahoClientFactory factory,
            MessageChannel mqttInputChannel) {

        int qos = Optional.ofNullable(props.qos()).orElse(0);
        String[] topics = Optional.ofNullable(props.topics()).orElse("#").replace(" ", "").split(",");

        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(props.clientId(), factory, topics);

        DefaultPahoMessageConverter converter = new DefaultPahoMessageConverter();
        converter.setPayloadAsBytes(false);
        adapter.setConverter(converter);
        adapter.setQos(qos);
        adapter.setOutputChannel(mqttInputChannel);

        log.info("MQTT subscribing clientId={} qos={} topics={}", props.clientId(), qos, String.join(",", topics));
        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler mqttInboundHandler(MqttAlarmMapper mapper,
                                             AlarmIngestService ingestService) {
        return message -> {
            String payload = String.valueOf(message.getPayload());
            String topic = String.valueOf(message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC));

            log.info("MQTT <= [{}] {}", topic, payload);

            if (!mapper.isAlarmLike(payload, topic)) {
                log.trace("DROP  <= [{}] {}", topic, payload);
                return;
            }

            AlarmEvent evt = mapper.toEvent(payload, topic); // timestamp = now (arrival)
            ingestService.ingest(evt);
            log.debug("ALARM <= [{}] {}", topic, evt);
        };
    }

    @ConfigurationProperties(prefix = "mqtt")
    public record MqttProps(
            String brokerUrl,
            String clientId,
            String topics,
            Integer qos,
            String username,
            String password,
            Boolean cleanSession,
            Integer keepAlive,
            Integer connectionTimeout,
            Long recoveryIntervalMs
    ) {}
}