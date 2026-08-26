import archiver from 'archiver';
import type { ExportFilterInput } from '@/lib/validations';
import type { Product, Warehouse, Category } from '@/lib/types';

interface ProductExportData extends Product {
  category_name: string | null;
  warehouse_stocks: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    reserved_quantity: number;
  }>;
  total_quantity: number;
}

function escapeXML(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateStableUUID(sku: string): string {
  // Generate consistent UUID from SKU for 1C compatibility
  // This ensures the same product gets the same UUID across exports
  const hash = sku
    .split('')
    .reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

export function generateCatalogXML(
  products: ProductExportData[],
  categories: Category[]
): string {
  const timestamp = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.10" ДатаФормирования="${timestamp}">
  <Классификатор>
    <Ид>CATALOG_${Date.now()}</Ид>
    <Наименование>Классификатор товаров</Наименование>
    <Группы>`;

  // Add categories
  categories.forEach((category) => {
    xml += `
      <Группа>
        <Ид>${generateStableUUID(`CAT_${category.id}`)}</Ид>
        <Наименование>${escapeXML(category.name)}</Наименование>
        ${category.description ? `<Описание>${escapeXML(category.description)}</Описание>` : ''}
      </Группа>`;
  });

  xml += `
    </Группы>
  </Классификатор>
  <Каталог СодержитТолькоИзменения="false">
    <Ид>CATALOG_${Date.now()}</Ид>
    <ИдКлассификатора>CATALOG_${Date.now()}</ИдКлассификатора>
    <Наименование>Каталог товаров</Наименование>
    <Товары>`;

  // Add products
  products.forEach((product) => {
    const productUUID = generateStableUUID(product.sku);
    const categoryUUID = product.category_id
      ? generateStableUUID(`CAT_${product.category_id}`)
      : '';

    xml += `
      <Товар>
        <Ид>${productUUID}</Ид>
        <Артикул>${escapeXML(product.sku)}</Артикул>
        <Наименование>${escapeXML(product.name)}</Наименование>
        ${product.description ? `<Описание>${escapeXML(product.description)}</Описание>` : ''}
        ${categoryUUID ? `<Группы><Ид>${categoryUUID}</Ид></Группы>` : ''}
        ${product.barcode ? `<ШтрихКод>${escapeXML(product.barcode)}</ШтрихКод>` : ''}
        <БазовыеЕдиницы>
          <БазоваяЕдиница Код="${escapeXML(product.unit)}" НаименованиеПолное="${escapeXML(product.unit)}" МеждународноеСокращение="${escapeXML(product.unit)}">
            <Наименование>${escapeXML(product.unit)}</Наименование>
          </БазоваяЕдиница>
        </БазовыеЕдиницы>
        ${product.variant ? `<ХарактеристикиТовара><ХарактеристикаТовара><Наименование>Вариант</Наименование><Значение>${escapeXML(product.variant)}</Значение></ХарактеристикаТовара></ХарактеристикиТовара>` : ''}
        <Статус>${escapeXML(product.status)}</Статус>
      </Товар>`;
  });

  xml += `
    </Товары>
  </Каталог>
</КоммерческаяИнформация>`;

  return xml;
}

export function generateOffersXML(
  products: ProductExportData[],
  warehouses: Warehouse[]
): string {
  const timestamp = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.10" ДатаФормирования="${timestamp}">
  <ПакетПредложений СодержитТолькоИзменения="false">
    <Ид>OFFERS_${Date.now()}</Ид>
    <Наименование>Пакет предложений</Наименование>
    <ТипЦен>
      <Ид>PRICE_TYPE_01</Ид>
      <Наименование>Розничная</Наименование>
      <Валюта>USD</Валюта>
    </ТипЦен>
    <ТипЦен>
      <Ид>PRICE_TYPE_02</Ид>
      <Наименование>Закупочная</Наименование>
      <Валюта>USD</Валюта>
    </ТипЦен>
    <Склады>`;

  // Add warehouses
  warehouses.forEach((warehouse) => {
    xml += `
      <Склад>
        <Ид>${generateStableUUID(`WH_${warehouse.id}`)}</Ид>
        <Наименование>${escapeXML(warehouse.name)}</Наименование>
      </Склад>`;
  });

  xml += `
    </Склады>
    <Предложения>`;

  // Add offers (products with prices and stock)
  products.forEach((product) => {
    const productUUID = generateStableUUID(product.sku);

    xml += `
      <Предложение>
        <Ид>${productUUID}</Ид>
        <Артикул>${escapeXML(product.sku)}</Артикул>
        <Наименование>${escapeXML(product.name)}</Наименование>
        <БазовыеЕдиницы>
          <БазоваяЕдиница Код="${escapeXML(product.unit)}">
            <Наименование>${escapeXML(product.unit)}</Наименование>
          </БазоваяЕдиница>
        </БазовыеЕдиницы>
        <Цены>
          <Цена>
            <ИдТипаЦены>PRICE_TYPE_01</ИдТипаЦены>
            <ЦенаЗаЕдиницу>${product.sale_price.toFixed(2)}</ЦенаЗаЕдиницу>
            <Валюта>USD</Валюта>
          </Цена>
          <Цена>
            <ИдТипаЦены>PRICE_TYPE_02</ИдТипаЦены>
            <ЦенаЗаЕдиницу>${product.cost_price.toFixed(2)}</ЦенаЗаЕдиницу>
            <Валюта>USD</Валюта>
          </Цена>
        </Цены>
        <Остатки>`;

    // Add stock per warehouse
    product.warehouse_stocks.forEach((stock) => {
      const warehouseUUID = generateStableUUID(`WH_${stock.warehouse_id}`);
      xml += `
          <Остаток>
            <Склад>
              <Ид>${warehouseUUID}</Ид>
            </Склад>
            <Количество>${stock.quantity}</Количество>
          </Остаток>`;
    });

    xml += `
        </Остатки>
      </Предложение>`;
  });

  xml += `
    </Предложения>
  </ПакетПредложений>
</КоммерческаяИнформация>`;

  return xml;
}

export async function generate1CExportZip(
  products: ProductExportData[],
  categories: Category[],
  warehouses: Warehouse[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    // Generate XML files
    const catalogXML = generateCatalogXML(products, categories);
    const offersXML = generateOffersXML(products, warehouses);

    // Add files to archive
    archive.append(catalogXML, { name: 'import.xml' });
    archive.append(offersXML, { name: 'offers.xml' });

    // Finalize archive
    archive.finalize();
  });
}

