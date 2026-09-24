package com.ctut.wms.wmscoreservice.repository.importnote;

import com.ctut.wms.wmscoreservice.entity.importnote.ImportNoteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportNoteDetailRepository extends JpaRepository<ImportNoteDetail, Long> {
}