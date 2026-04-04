package com.st6.weekly.security;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Entities;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class InputSanitizer {

    private static final Document.OutputSettings OUTPUT_SETTINGS = new Document.OutputSettings()
            .prettyPrint(false)
            .escapeMode(Entities.EscapeMode.xhtml)
            .charset("UTF-8");

    public String sanitize(String input) {
        if (input == null) {
            return null;
        }
        String cleaned = Jsoup.clean(input, "", Safelist.none(), OUTPUT_SETTINGS);
        // Jsoup escapes & to &amp; — decode entities back since we're storing plain text, not HTML
        return org.jsoup.parser.Parser.unescapeEntities(cleaned, false);
    }
}
