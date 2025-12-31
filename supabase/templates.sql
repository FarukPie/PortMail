-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject_template TEXT NOT NULL, -- e.g. "{ship_name} // PRE ARRIVAL // {port}"
    body_template TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
    ON email_templates FOR SELECT
    TO authenticated
    USING (true);

-- Insert default templates
INSERT INTO email_templates (name, subject_template, body_template, category, is_default) VALUES
(
    'Pre-Arrival Forms',
    '{ship_name} // PRE ARRIVAL // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nWe would like to kindly let you know that we will need attached pre-arrival forms preferably at least 48 hours before your good vessel''s arrival time to port area.\n\nPlease also find attached Martas port information.\n\nCan you please advise for below:\n• Which side do you prefer for berthing starboard side or portside.\n• How many hours preparation vessel need to commence loading.\n• Please send us Ballast water management certificate\n• Please send us all officer''s flag endorsements.\n\nYou are also kindly requested to send below documents directly to Sanitary office e-mail address 24 hours before arrival to {port} and cc to us please.\n\n• Maritime health declaration\n• Last ten port of call\n• Crew list\n• Copy of tonnage certificate\n\nOn the other hand; for your Turkish straits please send us the following documents, (If we are your Turkish Strait Agent)\n\n• Sp-1 and annex 3 (please send them at least 24 hours before arrival / For dangerous cargo carrier and special passage vessels 48 hours before)(Attached)\n• Tonnage certificate\n• Register certificate\n• Class certificate\n• Ship particulars\n• P&I\n• Bunker 2001 cert\n\nFor Health Declaration, 24 hours before arrival:\n• Last 10 Ports\n• Crew List\n• Maritime declaration form\n• All must be stamped and signed.\n\nPlease confirm safe receipt.\n\nBest Regards',
    'arrival',
    true
),
(
    'Departure Clearance',
    '{ship_name} // DEPARTURE CLEARANCE // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nPlease find attached the departure clearance documents for your vessel.\n\nKindly note the following:\n• Please ensure all cargo documents are ready\n• Crew list must be updated\n• All port dues have been settled\n\nPlease confirm safe receipt and advise your ETD.\n\nBest Regards',
    'departure',
    false
),
(
    'Crew Change Request',
    '{ship_name} // CREW CHANGE // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nWe are writing regarding the upcoming crew change at {port}.\n\nPlease provide the following documents for the joining crew:\n• Passport copies\n• Seaman''s book\n• Medical certificates\n• COVID-19 vaccination certificates\n• Flag state endorsements\n\nFor signing off crew:\n• Please prepare sign-off documents\n• Confirm transportation requirements\n\nPlease confirm the crew change schedule and any special requirements.\n\nBest Regards',
    'crew',
    false
),
(
    'Bunkering Request',
    '{ship_name} // BUNKERING REQUEST // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nPlease find attached the bunkering arrangement details for your vessel at {port}.\n\nKindly confirm:\n• Required quantity of fuel oil\n• Required quantity of diesel oil\n• Preferred bunkering time\n• Any special requirements\n\nPlease also provide:\n• Current ROB (Remaining on Board)\n• Tank capacity details\n\nPlease confirm safe receipt.\n\nBest Regards',
    'bunkering',
    false
),
(
    'Agency Appointment',
    '{ship_name} // AGENCY APPOINTMENT // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nWe are pleased to confirm our appointment as your agent at {port}.\n\nPlease find attached:\n• Agency appointment confirmation\n• Port information\n• Local regulations\n\nKindly provide:\n• ETA to port\n• Draft arrival/departure\n• Any special requirements\n• Cargo details\n\nWe will keep you informed of any updates.\n\nBest Regards',
    'agency',
    false
),
(
    'Turkish Straits Transit',
    '{ship_name} // TURKISH STRAITS TRANSIT // {port}',
    E'Dear Master,\n\nGood day,\n\nHope all fine,\n\nFor your Turkish Straits transit, please send us the following documents at least 24 hours before arrival:\n\n• SP-1 Form (attached)\n• Annex 3 Form (attached)\n• Tonnage Certificate\n• Register Certificate\n• Class Certificate\n• Ship Particulars\n• P&I Certificate\n• Bunker 2001 Certificate\n• IOPP Certificate\n• Safety Equipment Certificate\n\nFor dangerous cargo carriers and special passage vessels, documents must be submitted 48 hours before arrival.\n\nPlease confirm your:\n• ETA to Turkish Straits\n• Draft forward/aft\n• LOA and beam\n• Cargo details\n\nPlease confirm safe receipt.\n\nBest Regards',
    'straits',
    false
);

-- Update trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
