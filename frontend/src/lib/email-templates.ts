export interface EmailTemplate {
    id: string;
    name: string;
    subject_template: string;
    body_template: string;
    category: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
    {
        name: 'Pre-Arrival Forms',
        subject_template: '{ship_name} // PRE ARRIVAL // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

We would like to kindly let you know that we will need attached pre-arrival forms preferably at least 48 hours before your good vessel's arrival time to port area.

Please also find attached Martas port information.

Can you please advise for below:
• Which side do you prefer for berthing starboard side or portside.
• How many hours preparation vessel need to commence loading.
• Please send us Ballast water management certificate
• Please send us all officer's flag endorsements.

You are also kindly requested to send below documents directly to Sanitary office e-mail address 24 hours before arrival to {port} and cc to us please.

• Maritime health declaration
• Last ten port of call
• Crew list
• Copy of tonnage certificate

On the other hand; for your Turkish straits please send us the following documents, (If we are your Turkish Strait Agent)

• Sp-1 and annex 3 (please send them at least 24 hours before arrival / For dangerous cargo carrier and special passage vessels 48 hours before)(Attached)
• Tonnage certificate
• Register certificate
• Class certificate
• Ship particulars
• P&I
• Bunker 2001 cert

For Health Declaration, 24 hours before arrival:
• Last 10 Ports
• Crew List
• Maritime declaration form
• All must be stamped and signed.

Please confirm safe receipt.

Best Regards`,
        category: 'arrival',
        is_default: true,
    },
    {
        name: 'Departure Clearance',
        subject_template: '{ship_name} // DEPARTURE CLEARANCE // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

Please find attached the departure clearance documents for your vessel.

Kindly note the following:
• Please ensure all cargo documents are ready
• Crew list must be updated
• All port dues have been settled

Please confirm safe receipt and advise your ETD.

Best Regards`,
        category: 'departure',
        is_default: false,
    },
    {
        name: 'Crew Change Request',
        subject_template: '{ship_name} // CREW CHANGE // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

We are writing regarding the upcoming crew change at {port}.

Please provide the following documents for the joining crew:
• Passport copies
• Seaman's book
• Medical certificates
• COVID-19 vaccination certificates
• Flag state endorsements

For signing off crew:
• Please prepare sign-off documents
• Confirm transportation requirements

Please confirm the crew change schedule and any special requirements.

Best Regards`,
        category: 'crew',
        is_default: false,
    },
    {
        name: 'Bunkering Request',
        subject_template: '{ship_name} // BUNKERING REQUEST // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

Please find attached the bunkering arrangement details for your vessel at {port}.

Kindly confirm:
• Required quantity of fuel oil
• Required quantity of diesel oil
• Preferred bunkering time
• Any special requirements

Please also provide:
• Current ROB (Remaining on Board)
• Tank capacity details

Please confirm safe receipt.

Best Regards`,
        category: 'bunkering',
        is_default: false,
    },
    {
        name: 'Agency Appointment',
        subject_template: '{ship_name} // AGENCY APPOINTMENT // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

We are pleased to confirm our appointment as your agent at {port}.

Please find attached:
• Agency appointment confirmation
• Port information
• Local regulations

Kindly provide:
• ETA to port
• Draft arrival/departure
• Any special requirements
• Cargo details

We will keep you informed of any updates.

Best Regards`,
        category: 'agency',
        is_default: false,
    },
    {
        name: 'Turkish Straits Transit',
        subject_template: '{ship_name} // TURKISH STRAITS TRANSIT // {port}',
        body_template: `Dear Master,

Good day,

Hope all fine,

For your Turkish Straits transit, please send us the following documents at least 24 hours before arrival:

• SP-1 Form (attached)
• Annex 3 Form (attached)
• Tonnage Certificate
• Register Certificate
• Class Certificate
• Ship Particulars
• P&I Certificate
• Bunker 2001 Certificate
• IOPP Certificate
• Safety Equipment Certificate

For dangerous cargo carriers and special passage vessels, documents must be submitted 48 hours before arrival.

Please confirm your:
• ETA to Turkish Straits
• Draft forward/aft
• LOA and beam
• Cargo details

Please confirm safe receipt.

Best Regards`,
        category: 'straits',
        is_default: false,
    },
];

export function processTemplate(
    template: string,
    variables: Record<string, string>
): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}
