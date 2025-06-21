package com.presupuestos.negocioservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitConfig {
    public static final String EXCHANGE_PRODUCTOS = "producto.exchange";
    public static final String QUEUE_NEGOCIO_PRODUCTOS = "negocioservice.productos.queue";

    public static final String ROUTING_KEY_PATTERN = "producto.*";

    @Bean
    public TopicExchange productosExchange() {
        return new TopicExchange(EXCHANGE_PRODUCTOS);
    }

    @Bean
    public Queue negocioProductosQueue() {
        return new Queue(QUEUE_NEGOCIO_PRODUCTOS, true);
    }

    @Bean
    public Binding bindingProductos(Queue negocioProductosQueue, TopicExchange productosExchange) {
        return BindingBuilder
                .bind(negocioProductosQueue)
                .to(productosExchange)
                .with(ROUTING_KEY_PATTERN);
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory cf,
            Jackson2JsonMessageConverter converter) {
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(cf);
        f.setMessageConverter(converter);
        return f;
    }
}
