-- Add school location settings table
CREATE TABLE IF NOT EXISTS school_location (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Sekolah',
    address TEXT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 100, -- Default 100 meters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default school location (example: set your school's coordinates here)
INSERT INTO school_location (name, latitude, longitude, radius_meters) 
VALUES ('Sekolah', -6.2088, 106.8456, 100) 
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), 
    latitude = VALUES(latitude), 
    longitude = VALUES(longitude), 
    radius_meters = VALUES(radius_meters);
