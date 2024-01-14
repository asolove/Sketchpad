use three_d::*;

pub struct Line {
    start: u32,
    end: u32,
}

pub struct State {
    points: Vec<Vec2>,
    lines: Vec<Line>,
}

impl State {
    pub fn new() -> State {
        State {
            points: vec![vec2(10.0, 10.0), vec2(200.0, 200.0), vec2(100.0, 300.0)],
            lines: vec![Line { start: 0, end: 1 }],
        }
    }
}

pub fn main() {
    let window = Window::new(WindowSettings {
        title: "Sketchpad".to_string(),
        max_size: Some((1280, 720)),
        ..Default::default()
    })
    .unwrap();

    let mut state = State::new();

    let context = window.gl();
    let scale_factor = window.device_pixel_ratio();
    let (width, height) = window.size();

    window.render_loop(move |frame_input| {
        for event in frame_input.events.iter() {
            if let Event::MousePress {
                button,
                position,
                modifiers,
                ..
            } = event
            {
                if *button == MouseButton::Left && !modifiers.ctrl {
                    state
                        .points
                        .push(vec2(position.x, height as f32 - position.y))
                }
            }
        }

        let points: Vec<_> = state
            .points
            .iter()
            .map(|p| {
                Gm::new(
                    Circle::new(&context, p * scale_factor, 2.0 * scale_factor),
                    ColorMaterial {
                        color: Srgba::WHITE,
                        ..Default::default()
                    },
                )
            })
            .collect();

        let lines: Vec<_> = state
            .lines
            .iter()
            .map(|l| {
                Gm::new(
                    three_d::Line::new(
                        &context,
                        state.points[l.start as usize],
                        state.points[l.end as usize],
                        1.0,
                    ),
                    ColorMaterial {
                        color: Srgba::WHITE,
                        ..Default::default()
                    },
                )
            })
            .collect();

        frame_input
            .screen()
            .clear(ClearState::color_and_depth(0.0, 0.0, 0.0, 1.0, 1.0))
            .render(
                &Camera::new_2d(frame_input.viewport),
                lines.concat(points),
                &[],
            );

        FrameOutput::default()
    });
}
