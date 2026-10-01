import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { DEMO_PASSWORD } from "../src/lib/demo";
import type { Database } from "../src/lib/types";

const zone = "America/New_York";
const today = DateTime.now().setZone(zone).startOf("day");
const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

function wall(day: DateTime, hour = 10, minute = 0) {
  return day.set({ hour, minute, second: 0, millisecond: 0 }).toFormat("yyyy-MM-dd'T'HH:mm:ss");
}

function utc(day: DateTime, hour = 12) {
  return day.setZone(zone).set({ hour, minute: 0, second: 0 }).toUTC().toISO()!;
}

const nextSaturday = today.weekday === 6 ? today.plus({ weeks: 1 }) : today.plus({ days: (6 - today.weekday + 7) % 7 });
const rand = mulberry32(20260924);

const db: Database = {
  users: [
    user("u_maria", "Maria Alvarez", "manager1@demo.com", "manager", "en", "412-555-0142", "events,volunteers"),
    user("u_sam", "Sam Okonkwo", "manager2@demo.com", "manager", "en", "412-555-0177", "beds"),
    user("u_beech", "Beechview Steward", "beechview@demo.com", "manager", "en", "", "events,volunteer"),
    user("u_denise", "Denise Carter", "member1@demo.com", "user", "en", "412-555-0118", "tomatoes,herbs"),
    user("u_carlos", "Carlos Rivera", "member2@demo.com", "user", "es", "412-555-0190", "volunteer,learn"),
    user("u_priya", "Priya Shah", "user1@demo.com", "user", "en", "", "events"),
    user("u_luis", "Luis Gomez", "user2@demo.com", "user", "es", "412-555-0164", "learn"),
    user("u_pat", "Pat Nguyen", "pat@demo.com", "user", "en", "", "volunteer"),
    user("u_admin", "Avery Chen", "admin@demo.com", "user", "en", "", ""),
  ],
  gardens: [
    {
      garden_id: "g_beechview",
      slug: "beechview-community-garden",
      name: "Beechview Community Garden",
      description_en:
        "A neighborhood garden on the old pool site at 1229 Rockland Avenue, between Beechwood Elementary and Vannucci Park. Volunteers keep it going, and beds are rented through the city.",
      description_es:
        "Un jardín del vecindario en el terreno de la antigua piscina, en 1229 Rockland Avenue, entre la escuela Beechwood y el parque Vannucci. Lo cuidan voluntarios y las camas se alquilan a través de la ciudad.",
      address: "1229 Rockland Ave, Pittsburgh, PA 15216",
      neighborhood: "Beechview",
      timezone: zone,
      contact_email: "communitygardenbeechview@gmail.com",
      contact_phone: "",
      year_founded: "",
      bed_count: "27",
      cover_image_url: "/gardens/beechview/beds.jpg",
      involvement_options: "bed,volunteer,events,produce,learn",
      verified: true,
      created_by: "u_beech",
      created_at: utc(today.minus({ years: 2 })),
    },
    {
      garden_id: "g_riverside",
      slug: "riverside-community-garden",
      name: "Riverside Community Garden",
      description_en:
        "A shared garden along the Allegheny in Lawrenceville. We grow food, lend tools, and eat together.",
      description_es:
        "Un jardín compartido junto al río Allegheny, en Lawrenceville. Cultivamos comida, prestamos herramientas y comemos juntos.",
      address: "4200 Butler St, Pittsburgh, PA 15201",
      neighborhood: "Lawrenceville",
      timezone: zone,
      contact_email: "hello@riverside.garden",
      contact_phone: "412-555-0142",
      year_founded: "2014",
      bed_count: "12",
      cover_image_url: "/seed/riverside.svg",
      involvement_options: "bed,volunteer,events,produce,learn",
      verified: true,
      created_by: "u_maria",
      created_at: utc(today.minus({ months: 4 })),
    },
    {
      garden_id: "g_hilltop",
      slug: "hilltop-neighborhood-garden",
      name: "Hilltop Neighborhood Garden",
      description_en: "A young garden on the hill in Allentown. We are still building beds and want neighbors to shape it.",
      description_es:
        "Un jardín nuevo en la colina de Allentown. Todavía estamos haciendo las camas y queremos que el vecindario lo construya con nosotros.",
      address: "1400 Arlington Ave, Pittsburgh, PA 15210",
      neighborhood: "Allentown",
      timezone: zone,
      contact_email: "hello@hilltop.garden",
      contact_phone: "412-555-0177",
      year_founded: "2025",
      bed_count: "4",
      cover_image_url: "/seed/hilltop.svg",
      involvement_options: "volunteer,events,learn",
      verified: false,
      created_by: "u_sam",
      created_at: utc(today.minus({ days: 20 })),
    },
  ],
  gardenManagers: [
    { garden_id: "g_beechview", user_id: "u_beech", added_at: utc(today.minus({ years: 2 })) },
    { garden_id: "g_riverside", user_id: "u_maria", added_at: utc(today.minus({ months: 4 })) },
    { garden_id: "g_hilltop", user_id: "u_sam", added_at: utc(today.minus({ days: 20 })) },
  ],
  homeModules: [],
  memberships: [
    membership("m_denise", "g_riverside", "u_denise", "approved", "I would like a bed for tomatoes.", "bed,volunteer", -80, -79),
    membership("m_carlos", "g_riverside", "u_carlos", "approved", "Quiero ayudar los sábados.", "volunteer,learn", -40, -38),
    membership("m_pat", "g_riverside", "u_pat", "approved", "Happy to water during the week.", "volunteer", -30, -29),
    membership("m_luis", "g_riverside", "u_luis", "pending", "Vivo cerca y quiero aprender.", "learn,events", -2, 0),
  ],
  events: [],
  eventExceptions: [],
  rsvps: [],
  announcements: [
    {
      announcement_id: "a_water",
      garden_id: "g_riverside",
      title_en: "Please water your bed before Thursday",
      title_es: "Riega tu cama antes del jueves",
      body_en: "It will be hot this week. Morning watering keeps the tomatoes from splitting.",
      body_es: "Esta semana va a hacer calor. Regar en la mañana evita que los tomates se rompan.",
      visibility: "public",
      pinned: true,
      created_by: "u_maria",
      created_at: utc(today.minus({ days: 1 }), 9),
    },
    {
      announcement_id: "a_beech_gate",
      garden_id: "g_beechview",
      title_en: "The gate is open until dusk",
      title_es: "La reja está abierta hasta el anochecer",
      body_en: "Come by Rockland Avenue. Beds are rented through the city. Questions: communitygardenbeechview@gmail.com",
      body_es: "Pasa por Rockland Avenue. Las camas se alquilan a través de la ciudad. Preguntas: communitygardenbeechview@gmail.com",
      visibility: "public",
      pinned: true,
      created_by: "u_beech",
      created_at: utc(today.minus({ hours: 5 })),
    },
    {
      announcement_id: "a_beech_gate",
      garden_id: "g_beechview",
      title_en: "The gate is open until dusk",
      title_es: "La reja está abierta hasta el anochecer",
      body_en: "Come by Rockland Avenue. Beds are rented through the city. Questions: communitygardenbeechview@gmail.com",
      body_es: "Pasa por Rockland Avenue. Las camas se alquilan a través de la ciudad. Preguntas: communitygardenbeechview@gmail.com",
      visibility: "public",
      pinned: true,
      created_by: "u_beech",
      created_at: utc(today.minus({ hours: 6 })),
    },
    {
      announcement_id: "a_tools",
      garden_id: "g_riverside",
      title_en: "Tool library is restocked",
      title_es: "Ya hay más herramientas",
      body_en: "Gloves, harvest crates, and two new hoses are in the shed. Please sign them back in.",
      body_es: "Hay guantes, cajas para la cosecha y dos mangueras nuevas en el cobertizo. Anótalas cuando las devuelvas.",
      visibility: "public",
      pinned: false,
      created_by: "u_maria",
      created_at: utc(today.minus({ days: 6 }), 15),
    },
    {
      announcement_id: "a_members",
      garden_id: "g_riverside",
      title_en: "Members: compost bins moved",
      title_es: "Miembros: movimos los botes de composta",
      body_en: "The bins are now along the back fence so the path stays clear.",
      body_es: "Los botes están junto a la cerca de atrás para dejar el camino libre.",
      visibility: "members",
      pinned: false,
      created_by: "u_maria",
      created_at: utc(today.minus({ days: 3 }), 11),
    },
  ],
  activityLog: [],
  inboxState: [
    { user_id: "u_maria", garden_id: "g_riverside", last_seen_at: utc(today.minus({ days: 1 }), 8) },
    { user_id: "u_carlos", garden_id: "g_riverside", last_seen_at: utc(today.minus({ days: 4 }), 8) },
    { user_id: "u_denise", garden_id: "g_riverside", last_seen_at: utc(today.minus({ hours: 6 })) },
  ],
  beds: [],
  journalEntries: [],
  itemDonations: [],
  moneyDonations: [],
  visits: [],
  chatMessages: [],
  emails: [
    {
      email_id: "mail_1",
      to_email: "member2@demo.com",
      subject_en: "You are now a member of Riverside Community Garden",
      subject_es: "Ya eres parte del Jardín comunitario Riverside",
      body_en: "Maria approved your request. Member events are now open.",
      body_es: "Maria aprobó tu solicitud. Ya puedes ver los eventos para miembros.",
      created_at: utc(today.minus({ days: 38 })),
    },
  ],
  chatBans: [
    {
      garden_id: "g_riverside",
      user_id: "u_pat",
      banned_by: "u_maria",
      reason: "Repeated posts after a warning",
      created_at: utc(today.minus({ days: 1 }), 18),
      active: true,
    },
  ],
};

db.homeModules = [
  module("mod_hero", "g_riverside", "hero", 0, "Riverside Community Garden", "Jardín comunitario Riverside", "", ""),
  module(
    "mod_about",
    "g_riverside",
    "about",
    1,
    "About this garden",
    "Sobre este jardín",
    "We started in **2014** with eight neighbors and a pile of lumber.\n\n- 12 raised beds\n- A tool shed anyone in the garden can use\n- A long table for dinners\n\nNew here? Come to a workday. You do not need experience.",
    "Empezamos en **2014** con ocho vecinos y un montón de madera.\n\n- 12 camas elevadas\n- Un cobertizo de herramientas para quien participa\n- Una mesa larga para las cenas\n\n¿Eres nuevo? Ven a una jornada. No necesitas experiencia.",
  ),
  module("mod_gallery", "g_riverside", "gallery", 2, "Photos", "Fotos", "", "", {
    images: [
      { url: "/seed/beds.svg", alt_en: "Raised beds in summer", alt_es: "Camas elevadas en verano", caption_en: "Beds in July", caption_es: "Camas en julio" },
      { url: "/seed/table.svg", alt_en: "Community table", alt_es: "Mesa comunitaria", caption_en: "Thursday dinners", caption_es: "Cenas de los jueves" },
      { url: "/seed/harvest.svg", alt_en: "Tomatoes in a crate", alt_es: "Tomates en una caja", caption_en: "Harvest share", caption_es: "Reparto de cosecha" },
    ],
  }),
  module("mod_events", "g_riverside", "upcoming_events", 3, "Upcoming events", "Próximos eventos", "", ""),
  module("mod_ways", "g_riverside", "ways", 4, "Ways to get involved", "Cómo participar", "", "", {
    options: ["bed", "volunteer", "events", "produce", "learn"],
  }),
  module("mod_tools", "g_riverside", "tools", 5, "Tools and resources", "Herramientas y recursos", "", "", {
    items: [
      { name_en: "Wheelbarrows and gloves", name_es: "Carretillas y guantes", note_en: "In the shed. Sign the clipboard.", note_es: "En el cobertizo. Anótalo en la lista." },
      { name_en: "Hoses and watering cans", name_es: "Mangueras y regaderas", note_en: "Please coil the hose when you finish.", note_es: "Enrolla la manguera cuando termines." },
      { name_en: "Harvest crates", name_es: "Cajas para cosechar", note_en: "Shared. Wash and return the same day.", note_es: "Son compartidas. Lávalas y devuélvelas el mismo día." },
    ],
  }),
  module("mod_here", "g_riverside", "getting_here", 6, "Getting here", "Cómo llegar", "", "", {
    bus_en: "Buses 91 and 93 stop at Butler and 42nd.",
    bus_es: "Los autobuses 91 y 93 paran en Butler y la calle 42.",
    parking_en: "Street parking on Butler. Please do not block the alley.",
    parking_es: "Hay estacionamiento en la calle Butler. No bloquees el callejón.",
    access_en: "The main path is gravel. One bed is raised to wheelchair height. There is no restroom on site.",
    access_es: "El camino principal es de grava. Una cama está a la altura de una silla de ruedas. No hay baño en el lugar.",
  }),
  module("mod_news", "g_riverside", "announcements", 7, "Announcements", "Avisos", "", ""),
  module("mod_contact", "g_riverside", "contact", 8, "Contact", "Contacto", "", "", {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  }),
  module("mod_h_hero", "g_hilltop", "hero", 0, "Hilltop Neighborhood Garden", "Jardín del vecindario Hilltop", "", ""),
  module(
    "mod_h_about",
    "g_hilltop",
    "about",
    1,
    "About this garden",
    "Sobre este jardín",
    "Hilltop is just getting started. The beds are built. The rest is up to us.",
    "Hilltop apenas empieza. Las camas ya están. Lo demás lo hacemos juntos.",
  ),
  module("mod_h_events", "g_hilltop", "upcoming_events", 2, "Upcoming events", "Próximos eventos", "", ""),
  module("mod_h_ways", "g_hilltop", "ways", 3, "Ways to get involved", "Cómo participar", "", "", {
    options: ["volunteer", "events", "learn"],
  }),
  module("mod_h_here", "g_hilltop", "getting_here", 4, "Getting here", "Cómo llegar", "", "", {
    bus_en: "Bus 51 stops nearby on Arlington.",
    bus_es: "El autobús 51 para cerca, en Arlington.",
    parking_en: "A small lot is beside the gate.",
    parking_es: "Hay un estacionamiento pequeño junto a la entrada.",
    access_en: "The slope is steep. Tell us if you need a hand getting in.",
    access_es: "La pendiente es fuerte. Avísanos si necesitas ayuda para entrar.",
  }),
  module("mod_h_contact", "g_hilltop", "contact", 5, "Contact", "Contacto", "", "", {}),
  module("mod_b_hero", "g_beechview", "hero", 0, "Beechview Community Garden", "Jardín comunitario de Beechview", "", ""),
  module(
    "mod_b_about",
    "g_beechview",
    "about",
    1,
    "About this garden",
    "Sobre este jardín",
    "This garden is run by neighborhood volunteers, and beds are rentable through the city.\n\nIt sits on the old pool site at 1229 Rockland Avenue, between Beechwood Elementary and Vannucci Park.\n\n- Open from dawn until dusk\n- Flat ground, with picnic tables and benches\n- Dogs are not allowed\n\nQuestions: communitygardenbeechview@gmail.com",
    "Este jardín lo llevan voluntarios del vecindario y las camas se alquilan a través de la ciudad.\n\nEstá en el terreno de la antigua piscina, en 1229 Rockland Avenue, entre la escuela Beechwood y el parque Vannucci.\n\n- Abre del amanecer al anochecer\n- Terreno plano, con mesas y bancas\n- No se permiten perros\n\nPreguntas: communitygardenbeechview@gmail.com",
  ),
  module("mod_b_events", "g_beechview", "upcoming_events", 3, "Upcoming events", "Próximos eventos", "", ""),
  module("mod_b_gallery", "g_beechview", "gallery", 2, "This season", "Esta temporada", "", "", {
    images: [
      { url: "/gardens/beechview/beds.jpg", alt_en: "Raised beds with cosmos and marigolds", alt_es: "Camas elevadas con cosmos y cempasúchil", caption_en: "Beds along the path", caption_es: "Camas junto al camino" },
      { url: "/gardens/beechview/neighbors.jpg", alt_en: "Neighbors talking between the beds", alt_es: "Vecinos conversando entre las camas", caption_en: "A weeknight in the garden", caption_es: "Una tarde entre semana" },
      { url: "/gardens/beechview/dahlias.jpg", alt_en: "Pink dahlias beside tomato cages", alt_es: "Dalias rosas junto a las jaulas de tomate", caption_en: "Dahlias and tomatoes", caption_es: "Dalias y tomates" },
      { url: "/gardens/beechview/harvest.jpg", alt_en: "Tomatoes and green beans on a bench", alt_es: "Tomates y ejotes en una banca", caption_en: "A pick from the beds", caption_es: "Una cosecha de las camas" },
      { url: "/gardens/beechview/sign.jpg", alt_en: "Welcome sign on the garden fence", alt_es: "Letrero de bienvenida en la reja", caption_en: "The sign on Rockland", caption_es: "El letrero en Rockland" },
    ],
  }),
  module("mod_b_ways", "g_beechview", "ways", 4, "Ways to get involved", "Cómo participar", "", "", {
    options: ["bed", "volunteer", "events", "produce", "learn"],
  }),
  module("mod_b_here", "g_beechview", "getting_here", 5, "Getting here", "Cómo llegar", "", "", {
    bus_en: "The garden is on Rockland Avenue, between the school and Vannucci Park.",
    bus_es: "El jardín está en Rockland Avenue, entre la escuela y el parque Vannucci.",
    parking_en: "Park along Rockland, in the school lot when school is out, or at the playground.",
    parking_es: "Estaciona en Rockland, en el lote de la escuela cuando no hay clases, o en el parque.",
    access_en: "The ground is flat. The garden closes at dark. Please do not bring dogs.",
    access_es: "El terreno es plano. El jardín cierra al anochecer. No traigas perros.",
  }),
  module("mod_b_contact", "g_beechview", "contact", 6, "Contact", "Contacto", "", "", {}),
  module("mod_b_news", "g_beechview", "announcements", 7, "Announcements", "Avisos", "", ""),
];

const weeklyStart = nextSaturday.set({ hour: 10, minute: 0 });
const cancelledDate = nextSaturday.plus({ weeks: 2 }).toISODate()!;

db.events = [
  event("e_weekly", "g_riverside", "Saturday workday", "Jornada de los sábados", "Weeding, watering, and a snack at noon. Stay for an hour or the whole morning.", "Deshierbamos, regamos y hay algo de comer al mediodía. Quédate una hora o toda la mañana.", "workday", "public", weeklyStart, 2, "FREQ=WEEKLY;BYDAY=SA", nextSaturday.plus({ weeks: 7 }).toISODate()!, null),
  event("e_meeting", "g_riverside", "Member planning meeting", "Reunión de planificación", "Members look at the month ahead: beds, tools, and who is away.", "Las personas miembros revisan el mes: camas, herramientas y quiénes van a estar fuera.", "meeting", "members", today.plus({ days: 9 }).set({ hour: 18, minute: 30 }), 1.5, "FREQ=MONTHLY;COUNT=4", "", null),
  event("e_dinner", "g_riverside", "Community dinner", "Cena comunitaria", "Bring a dish if you can. Everyone eats, including kids.", "Trae un plato si puedes. Comemos todos, incluidas las niñas y los niños.", "meal", "public", today.plus({ days: 5 }).set({ hour: 18, minute: 0 }), 2, "", "", 40),
  event("e_full", "g_riverside", "Composting workshop", "Taller de composta", "A small group lesson beside the bins. This one is full.", "Una lección en grupo pequeño junto a los botes. Este taller ya está lleno.", "workshop", "public", today.plus({ days: 12 }).set({ hour: 11, minute: 0 }), 1.5, "", "", 10),
  event("e_harvest", "g_riverside", "Harvest share", "Reparto de cosecha", "Pick what is ready and take a bag home. No experience needed.", "Cosechamos lo que está listo y cada quien se lleva una bolsa. No necesitas experiencia.", "meal", "public", today.plus({ days: 20 }).set({ hour: 16, minute: 0 }), 2, "", "", null),
  event("e_kids", "g_riverside", "Kids planting day", "Día de siembra para niñas y niños", "Families plant beans and sunflowers. Tools are here.", "Las familias siembran frijoles y girasoles. Las herramientas están aquí.", "workshop", "public", today.plus({ days: 18 }).set({ hour: 10, minute: 0 }), 2, "", "", null),
  event("e_past", "g_riverside", "July workday", "Jornada de julio", "We mulched the paths.", "Cubrimos los caminos con mantillo.", "workday", "public", today.minus({ days: 14 }).set({ hour: 10, minute: 0 }), 2, "", "", null),
  event("e_past_meal", "g_riverside", "August dinner", "Cena de agosto", "Tomato night.", "Noche de tomates.", "meal", "public", today.minus({ days: 30 }).set({ hour: 18, minute: 0 }), 2, "", "", null),
  event("e_past_shop", "g_riverside", "Spring seed starting", "Siembra de primavera", "We started tomatoes indoors.", "Empezamos los tomates adentro.", "workshop", "public", today.minus({ days: 45 }).set({ hour: 11, minute: 0 }), 2, "", "", null),
  event("e_members_past", "g_riverside", "Budget check-in", "Revisión del presupuesto", "Members only notes from last month.", "Notas del mes pasado, solo para miembros.", "meeting", "members", today.minus({ days: 21 }).set({ hour: 18, minute: 0 }), 1, "", "", null),
  event("e_hill", "g_hilltop", "First workday", "Primera jornada", "Help us finish the paths.", "Ayúdanos a terminar los caminos.", "workday", "public", today.plus({ days: 8 }).set({ hour: 9, minute: 0 }), 3, "", "", null),
  event("e_beech_sat", "g_beechview", "Saturday open garden", "Jardín abierto el sábado", "Stop by the beds, water if you have a plot, or help with the shared plantings. Stay as long as you like.", "Pasa por las camas, riega si tienes una parcela o ayuda con las siembras compartidas. Quédate el tiempo que quieras.", "workday", "public", weeklyStart, 3, "FREQ=WEEKLY;BYDAY=SA", nextSaturday.plus({ weeks: 8 }).toISODate()!, null),
  event("e_beech_beds", "g_beechview", "Bed care morning", "Mañana de cuidado de camas", "A morning for weeding the shared herb and butterfly beds. Tools are on site.", "Una mañana para deshierbar las camas compartidas de hierbas y mariposas. Las herramientas están aquí.", "workday", "public", today.plus({ days: 3 }).set({ hour: 9, minute: 0 }), 2, "", "", null),
];

db.eventExceptions = [
  { exception_id: "x_weekly", event_id: "e_weekly", occurrence_date: cancelledDate, action: "cancelled" },
];

db.rsvps = [
  rsvp("r1", "e_dinner", today.plus({ days: 5 }).toISODate()!, "u_denise", "Denise Carter", "member1@demo.com", 2, true, "I can bring salad."),
  rsvp("r2", "e_dinner", today.plus({ days: 5 }).toISODate()!, "u_carlos", "Carlos Rivera", "member2@demo.com", 3, false, "Vamos en familia."),
  rsvp("r3", "e_dinner", today.plus({ days: 5 }).toISODate()!, "", "Jamie Cole", "jamie@example.com", 1, false, ""),
  rsvp("r4", "e_weekly", nextSaturday.toISODate()!, "u_denise", "Denise Carter", "member1@demo.com", 1, true, ""),
  ...fullWorkshop(),
];

const chat = [
  ["u_maria", -8, "Welcome, everyone. Ask questions here. Someone usually answers the same day."],
  ["u_denise", -8, "The hose on bed 3 leaks a little. I left a note on the shed."],
  ["u_carlos", -7, "Hola, ¿a qué hora abren los sábados?"],
  ["u_maria", -7, "Saturdays the gate is open from 9 to 1."],
  ["u_denise", -6, "I have extra basil starts if anyone wants some."],
  ["u_pat", -6, "Taking all of them."],
  ["u_carlos", -5, "Puedo regar entre semana después de las 6."],
  ["u_maria", -5, "Thank you, Carlos. The clipboard is on the shed door."],
  ["u_denise", -4, "Tomatoes are almost ready on bed 4."],
  ["u_priya", -4, "I walked by today. It looks beautiful from the sidewalk."],
  ["u_pat", -3, "This place is badly run and nobody should come."],
  ["u_maria", -3, "Pat, that does not help. Please keep it useful for neighbors."],
  ["u_denise", -2, "The community dinner still has room. Bring a plate if you can."],
  ["u_carlos", -2, "Ahí estaremos."],
  ["u_luis", -1, "Hola, mandé mi solicitud para unirme."],
  ["u_maria", -1, "Thanks, Luis. I will look at requests today."],
  ["u_denise", 0, "Watered beds 4 and 5 this morning."],
];

db.chatMessages = chat.map(([userId, day, body], index) => ({
  message_id: `c_${index + 1}`,
  garden_id: "g_riverside",
  user_id: String(userId),
  body: String(body),
  created_at: utc(today.plus({ days: Number(day) }), 10 + (index % 5)),
  deleted: index === 10,
  deleted_by: index === 10 ? "u_maria" : "",
}));

for (let i = 1; i <= 12; i += 1) {
  const assigned = i === 4 ? "u_denise" : i === 5 ? "u_denise" : i === 6 ? "u_carlos" : "";
  db.beds.push({
    bed_id: `b_${i}`,
    garden_id: "g_riverside",
    label: `Bed ${i}`,
    size: i % 3 === 0 ? "4x8" : "4x4",
    notes: i === 4 ? "Tomatoes and basil" : "",
    status: i === 12 ? "out_of_service" : assigned ? "assigned" : "available",
    assigned_user_id: assigned,
    season: String(today.year),
  });
}
for (let i = 1; i <= 4; i += 1) {
  db.beds.push({
    bed_id: `hb_${i}`,
    garden_id: "g_hilltop",
    label: `Bed ${i}`,
    size: "4x8",
    notes: "",
    status: "available",
    assigned_user_id: "",
    season: String(today.year),
  });
}

const beechBeds: Array<[string, string, string, string, string]> = [
  ["bb_herb", "Herb spiral", "8 ft round", "u_beech", "Basil and parsley for anyone who cooks"],
  ["bb_butterfly", "Butterfly bed", "4x12", "u_beech", "Milkweed and zinnias along the fence"],
  ["bb_tomato", "Tomato terrace", "4x16", "u_denise", "Cherokee Purple and Sungold"],
  ["bb_kale", "North kale", "4x8", "u_carlos", "Lacinato on the shady side"],
  ["bb_pepper", "Pepper row", "4x8", "u_denise", "Shishito and jalapeño"],
  ["bb_beans", "Pole beans", "4x8", "", "Open this season"],
  ["bb_squash", "Winter squash", "4x12", "u_beech", "Butternut on the south edge"],
  ["bb_garlic", "Garlic bed", "4x8", "u_beech", "Planted last fall"],
  ["bb_lettuce", "Cut-and-come lettuce", "4x4", "", "Shared leaves by the gate"],
  ["bb_strawberry", "Strawberry edge", "4x20", "u_beech", "June bearers along the path"],
  ["bb_sun", "Sunflower fence", "2x20", "", "A screen for the compost"],
  ["bb_sisters", "Three sisters", "8x8", "u_carlos", "Corn, beans, and squash"],
];
for (const [id, label, size, assigned, notes] of beechBeds) {
  db.beds.push({
    bed_id: id,
    garden_id: "g_beechview",
    label,
    size,
    notes,
    status: assigned ? "assigned" : "available",
    assigned_user_id: assigned,
    season: String(today.year),
  });
}

db.journalEntries = [
  journal("j1", "b_4", "u_denise", today.minus({ days: 70 }), "planted", "Tomato", "Planted four Cherokee Purple starts.", ["/seed/tomato.svg"], null, ""),
  journal("j2", "b_4", "u_denise", today.minus({ days: 40 }), "growing", "Tomato", "Staked the vines and added mulch.", ["/seed/basil.svg"], null, ""),
  journal("j3", "b_4", "u_denise", today.minus({ days: 12 }), "harvest", "Tomato", "First ripe tomatoes. Shared two pounds at the gate.", ["/seed/basket.svg"], 4.5, "lb"),
  journal("j4", "b_4", "u_denise", today.minus({ days: 2 }), "harvest", "Basil", "Cut basil before it flowered.", ["/seed/basil.svg"], 0.8, "lb"),
  journal("j5", "b_5", "u_denise", today.minus({ days: 20 }), "maintenance", "Pepper", "Replaced a broken soaker line.", [], null, ""),
  journal("j6", "b_6", "u_carlos", today.minus({ days: 15 }), "planted", "Kale", "Sembré col rizada en la mitad de la cama.", [], null, ""),
  journal("j7", "b_4", "u_denise", today.minus({ months: 3 }), "harvest", "Tomato", "Early cherry tomatoes.", [], 2, "lb"),
  journal("j8", "b_6", "u_carlos", today.minus({ months: 2 }), "harvest", "Kale", "Una cosecha pequeña.", [], 1.2, "kg"),
  journal("bj1", "bb_herb", "u_beech", today.minus({ days: 18 }), "growing", "Basil", "Pinched the basil so it stays bushy. Neighbors can cut a handful.", ["/gardens/beechview/beds.jpg"], null, "", "g_beechview"),
  journal("bj2", "bb_butterfly", "u_beech", today.minus({ days: 24 }), "growing", "Milkweed", "Monarch caterpillars on the milkweed. Please leave this bed alone.", ["/gardens/beechview/dahlias.jpg"], null, "", "g_beechview"),
  journal("bj3", "bb_tomato", "u_denise", today.minus({ days: 6 }), "harvest", "Tomato", "Sungolds are coming in. Left a bowl at the gate.", ["/gardens/beechview/harvest.jpg", "/gardens/beechview/dahlias.jpg"], 6, "lb", "g_beechview"),
  journal("bj4", "bb_kale", "u_carlos", today.minus({ days: 9 }), "growing", "Kale", "Las hojas están listas para cortar de afuera hacia adentro.", ["/gardens/beechview/neighbors.jpg"], null, "", "g_beechview"),
  journal("bj5", "bb_pepper", "u_denise", today.minus({ days: 11 }), "growing", "Pepper", "First shishitos. Still small.", ["/gardens/beechview/harvest.jpg"], null, "", "g_beechview"),
  journal("bj6", "bb_squash", "u_beech", today.minus({ days: 30 }), "growing", "Squash", "Vines are covering the straw. One fruit is sizing up.", ["/gardens/beechview/beds.jpg"], null, "", "g_beechview"),
  journal("bj7", "bb_garlic", "u_beech", today.minus({ days: 40 }), "maintenance", "Garlic", "Scapes came off last month. Bulbs are drying in the shade.", [], null, "", "g_beechview"),
  journal("bj8", "bb_lettuce", "u_beech", today.minus({ days: 3 }), "harvest", "Lettuce", "Cut a crate for the Saturday open garden.", ["/gardens/beechview/harvest.jpg"], 1.5, "lb", "g_beechview"),
  journal("bj9", "bb_strawberry", "u_beech", today.minus({ days: 50 }), "harvest", "Strawberry", "The June flush. Most of it walked out in neighbors' hands.", ["/gardens/beechview/beds.jpg"], 4.2, "lb", "g_beechview"),
  journal("bj10", "bb_sun", "u_beech", today.minus({ days: 21 }), "growing", "Sunflower", "Heads are turning toward Rockland Avenue.", ["/gardens/beechview/dahlias.jpg"], null, "", "g_beechview"),
  journal("bj11", "bb_sisters", "u_carlos", today.minus({ days: 16 }), "planted", "Corn", "Sembré el maíz. Los frijoles van cuando tenga un palmo de alto.", ["/gardens/beechview/neighbors.jpg"], null, "", "g_beechview"),
];

db.itemDonations = [
  { donation_id: "id_mulch", garden_id: "g_beechview", title: "Straw mulch, 6 bales", detail: "For the paths and the squash bed.", status: "needed", offered_by: "", offered_name: "", created_at: utc(today.minus({ days: 4 }), 9) },
  { donation_id: "id_cages", garden_id: "g_beechview", title: "Tomato cages", detail: "Four sturdy cages, not the thin conical ones.", status: "offered", offered_by: "u_denise", offered_name: "Denise Carter", created_at: utc(today.minus({ days: 3 }), 14) },
  { donation_id: "id_mats", garden_id: "g_beechview", title: "Seedling heat mat", detail: "Used for the pepper starts.", status: "received", offered_by: "u_carlos", offered_name: "Carlos Rivera", created_at: utc(today.minus({ days: 20 }), 11) },
  { donation_id: "id_hose", garden_id: "g_beechview", title: "Soaker hose, 50 ft", detail: "The terrace hose split.", status: "needed", offered_by: "", offered_name: "", created_at: utc(today.minus({ days: 2 }), 8) },
  { donation_id: "id_compost", garden_id: "g_beechview", title: "A yard of compost", detail: "Delivery to the Rockland gate is fine.", status: "offered", offered_by: "u_beech", offered_name: "Beechview Steward", created_at: utc(today.minus({ days: 1 }), 16) },
];

db.moneyDonations = [
  { donation_id: "md_denise", garden_id: "g_beechview", user_id: "u_denise", name: "Denise Carter", amount_cents: 4000, note: "For the compost delivery", created_at: utc(today.minus({ days: 5 }), 18) },
  { donation_id: "md_carlos", garden_id: "g_beechview", user_id: "u_carlos", name: "Carlos Rivera", amount_cents: 2500, note: "Para la manguera", created_at: utc(today.minus({ days: 4 }), 12) },
  { donation_id: "md_priya", garden_id: "g_beechview", user_id: "u_priya", name: "Priya Shah", amount_cents: 1500, note: "Glad the gate stays open until dusk", created_at: utc(today.minus({ days: 2 }), 19) },
  { donation_id: "md_steward", garden_id: "g_beechview", user_id: "u_beech", name: "Beechview Steward", amount_cents: 6000, note: "Lumber for the terrace", created_at: utc(today.minus({ days: 8 }), 10) },
  { donation_id: "md_pat", garden_id: "g_beechview", user_id: "u_pat", name: "Pat Nguyen", amount_cents: 2000, note: "", created_at: utc(today.minus({ days: 1 }), 15) },
  { donation_id: "md_maria", garden_id: "g_beechview", user_id: "u_maria", name: "Maria Alvarez", amount_cents: 5000, note: "From Riverside, for the shared hose", created_at: utc(today.minus({ days: 6 }), 9) },
];

const visitors = ["u_denise", "u_carlos", "u_maria", "u_pat"];
for (let i = 0; i < 160; i += 1) {
  const daysAgo = Math.floor(rand() * 200);
  const when = today.minus({ days: daysAgo }).set({ hour: 9 + Math.floor(rand() * 8) });
  db.visits.push({
    visit_id: `v_${i + 1}`,
    garden_id: "g_riverside",
    user_id: visitors[Math.floor(rand() * visitors.length)],
    visited_at: when.toUTC().toISO()!,
    source: rand() > 0.45 ? "checkin" : "rsvp",
  });
}
for (const row of db.rsvps.filter((item) => item.user_id && item.status === "going")) {
  db.visits.push({
    visit_id: `v_rsvp_${row.rsvp_id}`,
    garden_id: "g_riverside",
    user_id: row.user_id,
    visited_at: utc(DateTime.fromISO(row.occurrence_date, { zone }), 12),
    source: "rsvp",
  });
}

db.activityLog = [
  activity("act1", "g_riverside", "event_created", "e_dinner", "public", "", "Community dinner was added.", "Se agregó la cena comunitaria.", today.minus({ days: 2 })),
  activity("act2", "g_riverside", "announcement", "a_water", "public", "", "New announcement: Please water your bed before Thursday.", "Nuevo aviso: Riega tu cama antes del jueves.", today.minus({ days: 1 })),
  activity("act3", "g_riverside", "announcement", "a_members", "members", "", "New announcement: compost bins moved.", "Nuevo aviso: movimos los botes de composta.", today.minus({ days: 3 })),
  activity("act4", "g_riverside", "event_cancelled", "e_weekly", "public", "", `Saturday workday on ${cancelledDate} was cancelled.`, `Se canceló la jornada del sábado ${cancelledDate}.`, today.minus({ days: 1 })),
  activity("act5", "g_riverside", "membership_approved", "m_carlos", "public", "u_carlos", "You are now a member of Riverside Community Garden.", "Ya eres parte del Jardín comunitario Riverside.", today.minus({ days: 38 })),
  activity("act6", "g_riverside", "event_created", "e_meeting", "members", "", "A members-only meeting was added.", "Se agregó una reunión solo para miembros.", today.minus({ hours: 20 })),
  activity("act7", "g_hilltop", "event_created", "e_hill", "public", "", "First workday was added.", "Se agregó la primera jornada.", today.minus({ days: 2 })),
];

async function main() {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "data", "db.json"), JSON.stringify(db, null, 2));
  console.log(`Seeded ${db.users.length} users, ${db.gardens.length} gardens, ${db.events.length} events, ${db.visits.length} visits.`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

void main();

function user(
  id: string,
  name: string,
  email: string,
  account: "manager" | "user",
  language: "en" | "es",
  phone: string,
  tags: string,
) {
  return {
    user_id: id,
    name,
    email,
    password_hash: hash,
    account_type: account,
    language,
    phone,
    interest_tags: tags,
    created_at: utc(today.minus({ days: 90 })),
    status: "active" as const,
  };
}

function membership(
  id: string,
  gardenId: string,
  userId: string,
  status: "pending" | "approved",
  note: string,
  interests: string,
  requestedDays: number,
  decidedDays: number,
) {
  return {
    membership_id: id,
    garden_id: gardenId,
    user_id: userId,
    status,
    note,
    interests,
    requested_at: utc(today.plus({ days: requestedDays })),
    decided_at: status === "pending" ? "" : utc(today.plus({ days: decidedDays })),
    decided_by: status === "pending" ? "" : "u_maria",
  };
}

function module(
  id: string,
  gardenId: string,
  type: Database["homeModules"][number]["type"],
  position: number,
  titleEn: string,
  titleEs: string,
  bodyEn: string,
  bodyEs: string,
  config: Record<string, unknown> = {},
) {
  return {
    module_id: id,
    garden_id: gardenId,
    type,
    position,
    visible: true,
    title_en: titleEn,
    title_es: titleEs,
    body_en: bodyEn,
    body_es: bodyEs,
    config,
  };
}

function event(
  id: string,
  gardenId: string,
  titleEn: string,
  titleEs: string,
  descriptionEn: string,
  descriptionEs: string,
  category: Database["events"][number]["category"],
  visibility: "public" | "members",
  start: DateTime,
  hours: number,
  rule: string,
  until: string,
  capacity: number | null,
) {
  return {
    event_id: id,
    garden_id: gardenId,
    title_en: titleEn,
    title_es: titleEs,
    description_en: descriptionEn,
    description_es: descriptionEs,
    category,
    location:
      gardenId === "g_beechview"
        ? "1229 Rockland Ave, Pittsburgh, PA 15216"
        : gardenId === "g_riverside"
          ? "4200 Butler St, Pittsburgh, PA 15201"
          : "1400 Arlington Ave, Pittsburgh, PA 15210",
    start_datetime: wall(start, start.hour, start.minute),
    end_datetime: wall(start.plus({ hours }), start.plus({ hours }).hour, start.plus({ hours }).minute),
    all_day: false,
    visibility,
    capacity,
    recurrence_rule: rule,
    recurrence_until: until,
    status: "active" as const,
    created_by: gardenId === "g_beechview" ? "u_beech" : gardenId === "g_riverside" ? "u_maria" : "u_sam",
    created_at: utc(today.minus({ days: 10 })),
  };
}

function rsvp(
  id: string,
  eventId: string,
  date: string,
  userId: string,
  name: string,
  email: string,
  party: number,
  volunteer: boolean,
  note: string,
) {
  return {
    rsvp_id: id,
    event_id: eventId,
    occurrence_date: date,
    user_id: userId,
    name,
    email,
    party_size: party,
    volunteer,
    note,
    status: "going" as const,
    created_at: utc(today.minus({ days: 1 })),
  };
}

function fullWorkshop() {
  const date = today.plus({ days: 12 }).toISODate()!;
  const people = [
    ["Nora", "nora@example.com", 2],
    ["Eli", "eli@example.com", 2],
    ["Samira", "samira@example.com", 2],
    ["Chris", "chris@example.com", 2],
    ["Robin", "robin@example.com", 2],
  ] as const;
  return people.map(([name, email, party], index) =>
    rsvp(`rfull_${index}`, "e_full", date, "", name, email, party, false, ""),
  );
}

function journal(
  id: string,
  bedId: string,
  userId: string,
  day: DateTime,
  stage: Database["journalEntries"][number]["stage"],
  crop: string,
  text: string,
  images: string[],
  amount: number | null,
  unit: "" | "lb" | "kg",
  gardenId = "g_riverside",
) {
  return {
    entry_id: id,
    bed_id: bedId,
    garden_id: gardenId,
    user_id: userId,
    entry_date: day.toISODate()!,
    stage,
    crop,
    text,
    image_urls: images,
    harvest_amount: amount,
    harvest_unit: unit,
    created_at: utc(day, 17),
  };
}

function activity(
  id: string,
  gardenId: string,
  type: string,
  refId: string,
  visibility: "public" | "members",
  audience: string,
  summaryEn: string,
  summaryEs: string,
  day: DateTime,
) {
  return {
    activity_id: id,
    garden_id: gardenId,
    type,
    ref_id: refId,
    visibility,
    audience_user_id: audience,
    summary_en: summaryEn,
    summary_es: summaryEs,
    created_at: utc(day, 9),
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
