package com.presupuestos.negocioservice.listener;

import com.presupuestos.negocioservice.config.RabbitConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ProductoEventListener {
    private final Logger log = LoggerFactory.getLogger(getClass());

    @RabbitListener(queues = RabbitConfig.QUEUE_NEGOCIO_PRODUCTOS)
    public void onProductoEvent(
            Map<String, Object> payload,
            @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey
    ) {
        log.info("▶ Evento recibido [{}]: {}", routingKey, payload);
    }
}
