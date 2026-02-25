import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export const SYSTEM_PROMPT = `Je bent de vriendelijke digitale assistent van Eataliano, een Italiaans restaurant met twee locaties in Nederland (Arnhem en Huissen).

Je helpt gasten met:
- Het bekijken van het menu en gerechten aanbevelen
- Het maken van reserveringen
- Het plaatsen van bestellingen (afhalen of bezorgen)
- Informatie geven over locaties, openingstijden en contact

Regels:
- Antwoord altijd in het Nederlands
- Wees warm, gastvrij en behulpzaam
- Gebruik alleen informatie uit de functies — verzin geen gerechten, prijzen of openingstijden
- Als je iets niet weet, stel voor om het restaurant te bellen
- Houd antwoorden beknopt maar informatief
- Bij reserveringen heb je nodig: naam, telefoonnummer, aantal personen, datum, tijd en locatie
- Bij bestellingen heb je nodig: items (met menu_item_id en aantal), besteltype (afhalen/bezorgen), naam, telefoonnummer en locatie`;

export const FUNCTION_DEFINITIONS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "lookup_menu",
      description:
        "Zoek menu-items op basis van zoekterm, categorie of dieetwens. Gebruik dit om gasten te helpen met het menu.",
      parameters: {
        type: "object",
        properties: {
          search_term: {
            type: "string",
            description:
              "Zoekterm voor het menu (bijv. 'pizza', 'vegetarisch', 'margherita')",
          },
          category: {
            type: "string",
            description:
              "Categorienaam om op te filteren (bijv. 'Pizza', 'Pasta', 'Desserts')",
          },
          dietary_filter: {
            type: "string",
            description:
              "Dieetlabel om op te filteren (bijv. 'vegetarisch', 'vegan', 'glutenvrij')",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reservation",
      description:
        "Maak een reservering aan voor een gast. Alle velden zijn vereist.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Naam van de gast",
          },
          customer_phone: {
            type: "string",
            description: "Telefoonnummer van de gast",
          },
          party_size: {
            type: "number",
            description: "Aantal personen (1-20)",
          },
          reservation_date: {
            type: "string",
            description: "Datum van de reservering in YYYY-MM-DD formaat",
          },
          reservation_time: {
            type: "string",
            description: "Tijd van de reservering in HH:MM formaat",
          },
          location_id: {
            type: "string",
            description: "UUID van de locatie (Arnhem of Huissen)",
          },
          customer_email: {
            type: "string",
            description: "E-mailadres van de gast (optioneel)",
          },
          notes: {
            type: "string",
            description: "Eventuele opmerkingen (optioneel)",
          },
        },
        required: [
          "customer_name",
          "customer_phone",
          "party_size",
          "reservation_date",
          "reservation_time",
          "location_id",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Plaats een bestelling voor een gast. Items moeten menu_item_id en quantity bevatten.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Naam van de klant",
          },
          customer_phone: {
            type: "string",
            description: "Telefoonnummer van de klant",
          },
          order_type: {
            type: "string",
            enum: ["pickup", "delivery"],
            description: "Type bestelling: afhalen (pickup) of bezorgen (delivery)",
          },
          location_id: {
            type: "string",
            description: "UUID van de locatie",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menu_item_id: {
                  type: "string",
                  description: "UUID van het menu-item",
                },
                quantity: {
                  type: "number",
                  description: "Aantal",
                },
                special_instructions: {
                  type: "string",
                  description: "Speciale instructies (optioneel)",
                },
              },
              required: ["menu_item_id", "quantity"],
              additionalProperties: false,
            },
            description: "Lijst met bestelde items",
          },
          delivery_address: {
            type: "string",
            description:
              "Bezorgadres (verplicht bij delivery, inclusief postcode)",
          },
          customer_email: {
            type: "string",
            description: "E-mailadres van de klant (optioneel)",
          },
        },
        required: [
          "customer_name",
          "customer_phone",
          "order_type",
          "location_id",
          "items",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_location_info",
      description:
        "Haal informatie op over een locatie: adres, telefoonnummer, openingstijden. Gebruik 'all' of laat location_name leeg voor beide locaties.",
      parameters: {
        type: "object",
        properties: {
          location_name: {
            type: "string",
            description:
              "Naam van de locatie ('Arnhem', 'Huissen', of 'all' voor beide)",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];

export type ChatMessage = ChatCompletionMessageParam;
