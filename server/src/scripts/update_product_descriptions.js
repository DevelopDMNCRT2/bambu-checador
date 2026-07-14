const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: connectionString
});

const updates = [
    // Barra de Café
    {
        id: 1, // Americano
        description: "Disfruta de la esencia pura del café con nuestro Americano, preparado con una selección de granos premium recién molidos. Una bebida robusta y aromática que despierta tus sentidos y te ofrece la energía necesaria para comenzar tu día con el pie derecho, manteniendo un equilibrio perfecto entre acidez y cuerpo."
    },
    {
        id: 2, // Capuccino
        description: "La armonía perfecta entre un espresso intenso, leche vaporizada a la temperatura ideal y una capa suave de espuma cremosa. Nuestro Capuccino es una experiencia envolvente, espolvoreado con un toque de canela o cacao para resaltar sus notas dulces naturales, ideal para una tarde relajada o una mañana inspirada."
    },
    {
        id: 3, // Frappe
        description: "Refrescante y delicioso, nuestro Frappe combina la intensidad del café con hielo granizado y una textura cremosa irresistible. Decorado con crema batida ligera y un toque dulce, es la opción perfecta para combatir el calor sin sacrificar el sabor de un buen café de altura, brindándote un momento de frescura y placer."
    },
    {
        id: 4, // Latte
        description: "Una experiencia suave y reconfortante, donde el espresso se encuentra con una generosa cantidad de leche sedosa. Perfecto para quienes prefieren un sabor a café más sutil pero cremoso, nuestro Latte se prepara con dedicación para ofrecerte una bebida cálida que abraza tu paladar con cada sorbo."
    },
    {
        id: 5, // Moka
        description: "Para los amantes del chocolate y el café, el Moka es la fusión celestial de espresso de calidad, cacao rico y leche espumosa. Una bebida indulgente que equilibra el amargor del café con la dulzura del chocolate, creando una taza reconfortante que se siente como un postre líquido lleno de energía."
    },

    // Bebidas
    {
        id: 20, // Jugo Verde
        description: "Una bomba de vitalidad preparada al momento con una mezcla fresca de espinaca, pepino, apio, piña y jugo de naranja natural. Este elixir desintoxicante está cargado de vitaminas, minerales y antioxidantes, diseñado para revitalizar tu cuerpo, mejorar tu digestión y llenarte de energía natural."
    },
    {
        id: 19, // Jugo de Naranja
        description: "Simplemente lo mejor de la naturaleza en tu vaso. Exprimido al momento utilizando solo las naranjas más dulces y jugosas de la temporada. Sin conservadores, sin azúcar añadida, solo el sabor vibrante y fresco de la vitamina C natural para fortalecer tu sistema inmunológico y empezar el día con frescura."
    },

    // Desayunos
    {
        id: 15, // Chilaquiles Sencillos
        description: "Crujientes totopos de maíz horneados diariamente, bañados en nuestra salsa casera verde o roja, preparados con ingredientes frescos y especias tradicionales. Servidos con crema fresca, queso cotija espolvoreado, cebolla morada y cilantro, son el desayuno mexicano por excelencia, lleno de sabor y tradición en cada bocado."
    },
    {
        id: 14, // Chilaquiles con Pollo
        description: "Llevamos nuestros clásicos chilaquiles al siguiente nivel agregando pechuga de pollo deshebrada tierna y jugosa. La combinación perfecta de proteína magra y el sabor auténtico de nuestra salsa casera, acompañados de crema, queso y cebolla, creando un platillo completo, nutritivo y absolutamente delicioso para saciar tu hambre."
    },
    {
        id: 16, // Enchiladas Verdes con Pollo
        description: "Tres tortillas de maíz suavemente pasadas por aceite, rellenas de generosas porciones de pollo deshebrado y bañadas en nuestra salsa verde de tomatillo y chiles serranos. Gratinadas con queso manchego fundido y adornadas con crema, son un abrazo cálido de sabor mexicano, perfectas para un almuerzo reconfortante y lleno de sabor."
    },
    {
        id: 17, // Fruta con Yogurt
        description: "Una selección colorida de las frutas más frescas de la temporada, cortadas cada mañana para garantizar su dulzura y textura. Acompañadas de yogurt natural cremoso o griego rico en proteínas, y coronadas con nuestra granola artesanal crujiente y un hilo de miel de abeja pura. Un desayuno ligero, saludable y energizante."
    },
    {
        id: 18, // Hot Cakes
        description: "Esponjosos y dorados, nuestros Hot Cakes se preparan con una receta especial que garantiza una textura suave y aireada. Servidos calientes con mantequilla de calidad y miel de maple real, acompañados de frutos rojos frescos para un toque ácido que contrasta perfectamente con la dulzura, haciendo de tu desayuno un momento especial."
    },
    {
        id: 22, // Molletes Sencillos
        description: "Bolillo artesanal tostado a la perfección, untado con frijoles refritos sazonados en casa y cubierto con una generosa capa de queso manchego gratinado hasta burbujear. Acompañados de nuestra salsa pico de gallo fresca hecha al momento, son la opción ideal para un desayuno rápido, satisfactorio y con el sabor de hogar que te encanta."
    },
    {
        id: 21, // Molletes con Jamón
        description: "Nuestros deliciosos molletes tradicionales mejorados con rebanadas de jamón de pavo de primera calidad debajo del queso fundido. La mezcla de lo salado del jamón, la cremosidad del queso y el sabor terroso de los frijoles sobre pan crujiente crea un equilibrio perfecto, servido siempre con nuestra salsa pico de gallo fresca a un lado."
    },

    // Huevos
    {
        id: 31, // Huevos al Gusto
        description: "Prepárate para disfrutar de dos huevos de granja frescos preparados exactamente como a ti te gustan: revueltos, estrellados o a la mexicana. Servidos con frijoles refritos caseros y tortillas calientes o pan tostado. Un desayuno clásico, nutritivo y adaptado a tus preferencias, cocinado con el punto exacto de sazón y cariño."
    },
    {
        id: 29, // Omelette Vegetariano
        description: "Una opción ligera y nutritiva preparada con claras o huevo entero, relleno de una mezcla salteada de espinacas frescas, champiñones, pimientos y cebolla. Cocinado a la perfección para mantener la jugosidad de las verduras, es una excelente fuente de proteínas y vitaminas, ideal para comenzar el día cuidando tu salud sin sacrificar sabor."
    },
    {
        id: 28, // Omelette con Jamón
        description: "Clásico y delicioso, nuestro omelette se prepara con huevos batidos esponjosos y se rellena con abundante jamón de pavo picado y queso manchego que se funde en su interior. Acompañado de frijolitos refritos o una pequeña ensalada fresca, es un desayuno proteico y satisfactorio que te mantendrá lleno de energía durante toda la mañana."
    },
    {
        id: 30, // Omelette de Champiñones
        description: "Delicado y sabroso, este omelette está relleno de champiñones frescos salteados con un toque de epazote y cebolla para resaltar su sabor terroso. Combinado con queso panela o manchego fundido, ofrece una experiencia gourmet ligera y saludable, perfecta para quienes buscan opciones vegetarianas llenas de sabor y textura."
    },

    // Menú del Día
    {
        id: 27, // Agua del Día
        description: "Refresca tu paladar con nuestra agua fresca preparada diariamente con frutas naturales de temporada. Desde horchata artesanal hasta jamaica infusionada o frutas tropicales, cada sorbo es un estallido de sabor natural, endulzada ligeramente para mantener el equilibrio perfecto y acompañar tus alimentos de la manera más saludable."
    },
    {
        id: 24, // Cambo Bambú Infantil
        description: "Pensado especialmente para los pequeños, este combo incluye porciones adecuadas de un platillo principal nutritivo y divertido, acompañado de una guarnición de verduras o fruta y una bebida natural pequeña. Comida real, equilibrada y deliciosa que a los niños les encanta y a los papás les da tranquilidad."
    },
    {
        id: 23, // Combo Bambú Adulto
        description: "La solución perfecta para tu comida diaria. Incluye una sopa del día reconfortante, un plato fuerte equilibrado con proteína y guarniciones, y agua fresca de sabor. Preparado con ingredientes frescos y recetas caseras que varían diariamente para ofrecerte una alimentación completa, variada y deliciosa a un precio excelente."
    },
    {
        id: 26, // Plato Fuerte del Día
        description: "Nuestra especialidad rotativa, preparada con los ingredientes más frescos del mercado. Cada día ofrecemos una receta diferente, desde guisados tradicionales hasta creaciones contemporáneas, siempre balanceadas con proteína, vegetales y cereales. Pregunta por la opción de hoy y déjate sorprender por el sabor de nuestra cocina."
    },
    {
        id: 25, // Sopa del Día
        description: "Comienza tu comida con una sopa caliente y reconfortante, hecha desde cero con caldos naturales y vegetales frescos. Ya sea una crema de verduras, una sopa de pasta tradicional o un consomé, nuestra sopa del día es el primer paso perfecto para una comida nutritiva, preparándote para disfrutar de los siguientes tiempos."
    },

    // Sandwiches
    {
        id: 6, // Chapata de Atún
        description: "Pan chapata artesanal horneado con masa madre, crujiente por fuera y suave por dentro, relleno de nuestra ensalada de atún especial preparada con mayonesa ligera, elote y verduras. Acompañada de lechuga fresca, jitomate y aguacate, es una opción fresca y satisfactoria, rica en omega-3 y perfecta para un almuerzo ligero pero completo."
    },
    {
        id: 7, // Chapata de Pechuga de Pavo
        description: "Deliciosa chapata rústica rellena con generosas rebanadas de pechuga de pavo ahumada premium. Complementada con queso manchego fundido, aguacate cremoso, germen de alfalfa, jitomate y nuestro aderezo de la casa. Una combinación clásica de sabores frescos y texturas crujientes que te dejará satisfecho y lleno de energía."
    },
    {
        id: 8, // Chapata de Pollo
        description: "Pechuga de pollo a la parrilla sazonada con hierbas finas, servida dentro de una chapata crujiente. Agregamos queso gratinado, rodajas de jitomate fresco, lechuga orejona y un toque de mostaza dijon o aderezo chipotle. Un sándwich robusto y lleno de sabor, ideal para quienes buscan una comida rica en proteínas y baja en grasa."
    },
    {
        id: 9, // Croissant de Jamón y Queso
        description: "Auténtico croissant de mantequilla, ligero y hojaldrado, relleno con jamón de pierna y queso manchego o suizo. Se calienta ligeramente para que el queso se funda y el pan recupere su textura crujiente. Una opción elegante y deliciosa para el desayuno o un brunch ligero, combinando la técnica francesa con ingredientes frescos."
    },
    {
        id: 10, // Croissant de Queso con Zarzamora
        description: "Una experiencia dulce y salada inolvidable. Nuestro croissant de mantequilla relleno de queso crema suave y mermelada de zarzamora artesanal. El contraste entre la acidez de la fruta y la cremosidad del queso, envuelto en masa hojaldrada, lo convierte en el acompañamiento perfecto para tu café de la mañana o un postre de media tarde."
    },
    {
        id: 11, // Sandwich de Atún
        description: "El clásico reinventado. Pan integral de granos enteros tostado, relleno con nuestra mezcla fresca de atún, apio picado para un toque crunch, y un toque de limón. Servido con abundantes hojas de espinaca, jitomate y aguacate. Una comida ligera, saludable y cardiosaludable que no sacrifica el sabor por la nutrición."
    },
    {
        id: 12, // Sandwich de Pechuga de Pavo
        description: "Sencillo, saludable y delicioso. Pan multigrano suave con rebanadas de pechuga de pavo baja en sodio, queso panela fresco, rodajas de pepino, jitomate y un toque de hummus o aderezo de yogurt. Diseñado para ser ligero en el estómago pero rico en nutrientes, ideal para mantener tu energía durante una jornada de trabajo activa."
    },
    {
        id: 13, // Sandwich de Pollo
        description: "Jugosa pechuga de pollo deshebrada mezclada con un poco de crema y especias suaves, servida entre dos rebanadas de pan artesanal tostado. Acompañado de lechuga crujiente, jitomate y aguacate. Una versión casera y reconfortante del sandwich de pollo, preparado con ingredientes naturales para ofrecerte una comida balanceada y sabrosa."
    }
];

async function updateDescriptions() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log(`Updating descriptions for ${updates.length} products...`);

        for (const update of updates) {
            await client.query('UPDATE menu_items SET description = $1 WHERE id = $2', [update.description, update.id]);
        }

        await client.query('COMMIT');
        console.log('✅ All product descriptions updated successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating descriptions:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

updateDescriptions();
