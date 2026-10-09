import type { SheetMapping } from '../src/lib/server/import';

/**
 * How each tab of the original Google Sheet maps onto a bookcase.
 * Tabs are listed in shelf order; `rows` are listed from the bottom row up.
 */
export const mappings: SheetMapping[] = [
	{
		file: 'curriculum.csv',
		shelf: '유아 도서 및 커리큘럼 연간 계획표',
		periodColumn: '월',
		weekColumn: '주차',
		themeColumn: '공통주제',
		rows: [{ column: '만3세' }, { column: '만4세' }, { column: '만5세' }]
	},
	{
		file: 'age2.csv',
		shelf: '만2세 인성동화',
		periodColumn: '월',
		weekColumn: '주차',
		rows: [{ column: '도서명', label: '만2세 인성동화' }]
	},
	{
		file: 'age3to5.csv',
		shelf: '만3세-5세 도서목록',
		periodColumn: '월',
		rows: [
			{ column: '만3세 인성동화' },
			{ column: '만3세 음악동화' },
			{ column: '만4세 음악동화' },
			{ column: '만5세 음악동화' }
		]
	}
];
