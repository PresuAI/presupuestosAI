package com.presupuestos.usuarioservice.validation;

import com.presupuestos.usuarioservice.model.Rol;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EnumValidatorTest {

    private EnumValidator validator;
    private ConstraintValidatorContext context;

    @BeforeEach
    void setUp() {
        validator = new EnumValidator();

        validator.initialize(new ValidEnum() {
            @Override
            public Class<? extends Enum<?>> enumClass() {
                return Rol.class;
            }

            @Override
            public String message() {
                return null;
            }

            @Override
            public Class<?>[] groups() {
                return new Class[0];
            }

            @Override
            public Class<? extends jakarta.validation.Payload>[] payload() {
                return new Class[0];
            }

            @Override
            public Class<? extends java.lang.annotation.Annotation> annotationType() {
                return ValidEnum.class;
            }
        });

        context = mock(ConstraintValidatorContext.class);
    }

    @Test
    void isValid_valueInEnum_shouldReturnTrue() {
        assertTrue(validator.isValid("ADMIN", context));
        assertTrue(validator.isValid("usuario", context)); // case insensitive
    }

    @Test
    void isValid_valueNotInEnum_shouldReturnFalse() {
        assertFalse(validator.isValid("OTRO", context));
        assertFalse(validator.isValid("INVALIDO", context));
    }

    @Test
    void isValid_nullValue_shouldReturnFalse() {
        assertFalse(validator.isValid(null, context));
    }
}