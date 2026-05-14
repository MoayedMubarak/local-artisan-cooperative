package com.example.demo.repository;

import com.example.demo.model.Artisan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArtisanRepository extends JpaRepository<Artisan, Long> {
    List<Artisan> findByApproved(boolean approved);
    long countByApproved(boolean approved);
}
