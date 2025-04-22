SET autocommit = 1;
DELIMITER //
CREATE TRIGGER log_user_login
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    -- If the ultimo_login field has been updated
    IF NEW.ultimo_login != OLD.ultimo_login THEN
        -- Log the login to history table
        INSERT INTO Login_History (id_usuario)
        VALUES (NEW.id_usuario);
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER log_user_login
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    -- If the ultimo_login field has been updated
    IF NEW.ultimo_login != OLD.ultimo_login THEN
        -- Log the login to history table
        INSERT INTO Login_History (id_usuario)
        VALUES (NEW.id_usuario);
    END IF;
END //

CREATE TRIGGER log_user_registration
AFTER INSERT ON Usuario
FOR EACH ROW
BEGIN
    -- Log the first login (registration) to history table
    INSERT INTO Login_History (id_usuario)
    VALUES (NEW.id_usuario);
END //
DELIMITER ;

SELECT * FROM Login_History;
SHOW TRIGGERS;