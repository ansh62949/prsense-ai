package com.prsense.backend.controller;

import com.prsense.backend.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> ingestDocument(@RequestBody Map<String, String> body) {
        String repoFullName = body.get("repoFullName");
        String title = body.get("title");
        String content = body.get("content");
        String contentType = body.get("contentType");
        String sourceUrl = body.get("sourceUrl");

        boolean success = knowledgeService.ingestDocument(repoFullName, title, content, contentType, sourceUrl);
        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Document successfully indexed." : "Failed to index document."
        ));
    }

    @PostMapping("/search")
    public ResponseEntity<Map<String, Object>> searchRag(@RequestBody Map<String, Object> body) {
        String repoFullName = (String) body.get("repoFullName");
        String query = (String) body.get("query");
        String contentType = (String) body.get("contentType");
        Integer topK = (Integer) body.get("topK");

        Map<String, Object> result = knowledgeService.queryRag(repoFullName, query, contentType, topK);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askRepository(@RequestBody Map<String, String> body) {
        String repoFullName = body.get("repoFullName");
        String query = body.get("query");

        Map<String, Object> result = knowledgeService.askRepository(repoFullName, query);
        return ResponseEntity.ok(result);
    }
}
