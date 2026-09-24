package com.ctut.wms.wmscoreservice.repository.exportnote;


import com.ctut.wms.wmscoreservice.entity.exportnote.ExportNoteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportNoteDetailRepository extends JpaRepository<ExportNoteDetail, Long> {
}