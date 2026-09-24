package com.ctut.wms.wmscoreservice.repository.exportnote;


import com.ctut.wms.wmscoreservice.entity.exportnote.ExportNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportNoteRepository extends JpaRepository<ExportNote, Long> {
}