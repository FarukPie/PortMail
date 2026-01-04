-- ============================================
-- PORT-BASED EMAIL SYSTEM
-- Limanlar ve ekli dosyaları için şema
-- ============================================

-- Drop old templates table if exists
DROP TABLE IF EXISTS email_templates CASCADE;

-- ============================================
-- PORTS TABLE (Limanlar)
-- ============================================
CREATE TABLE ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,              -- "TEKIRDAG", "ISTANBUL", "IZMIR"
    email_subject TEXT NOT NULL,            -- "{ship_name} // PRE ARRIVAL // TEKIRDAG"
    email_body TEXT NOT NULL,               -- Email içeriği (sadece {ship_name} değişken)
    recipient_email TEXT,                   -- Opsiyonel: varsayılan alıcı
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for ports
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ports"
    ON ports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert ports"
    ON ports FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update ports they created"
    ON ports FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete ports they created"
    ON ports FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- PORT_ATTACHMENTS TABLE (Liman Dosyaları)
-- ============================================
CREATE TABLE port_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,                -- Storage path
    file_name TEXT NOT NULL,                -- Orijinal dosya adı
    file_size INTEGER,
    file_type TEXT,                         -- MIME type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for port_attachments
ALTER TABLE port_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view port attachments"
    ON port_attachments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert port attachments"
    ON port_attachments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete port attachments"
    ON port_attachments FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_ports_name ON ports(name);
CREATE INDEX idx_port_attachments_port_id ON port_attachments(port_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_ports_updated_at
    BEFORE UPDATE ON ports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
